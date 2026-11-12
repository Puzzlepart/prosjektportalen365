import { LogLevel } from '@pnp/logging'
import { PermissionKind } from '@pnp/sp/presets/all'
import strings from 'ProjectWebPartsStrings'
import {
  CustomError,
  ItemFieldValues,
  ListLogger,
  ProjectAdminPermission,
  ProjectInformationParentProject,
  ProjectInformationChildProject,
  errorWithCause
} from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect } from 'react'
import SPDataAdapter from '../../../data'
import { DataFetchFunction } from '../../../types/DataFetchFunction'
import { IProjectInformationContext } from '../context'
import { ProjectInformation } from '../index'
import { FETCH_DATA_ERROR, INIT_DATA } from '../reducer'
import { IProjectInformationState } from '../types'
import { fetchProjectStatusReportData } from './fetchProjectStatusReportData'

/**
 * Falls back when an optional data source fails, so unavailable hub data need not hide local data.
 */
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

/** Loads project properties and the hub data and permissions needed by the host page. */
const fetchData: DataFetchFunction<
  IProjectInformationContext,
  Partial<IProjectInformationState>
> = async (context) => {
  try {
    const isFrontpage = context.props.page === 'Frontpage'
    const shouldFetchArchiveStatus = isFrontpage && !context.props.hideArchiveStatus
    // Empty fallback for users without read access to the project site (e.g. the
    // Portfolio Insight panel opened from a portfolio overview) instead of a hard error.
    const projectInformationData = await safeCall(
      () => SPDataAdapter.project.getProjectInformationData(),
      {
        fieldValues: new ItemFieldValues(),
        fields: [],
        propertiesListId: null,
        templateParameters: {}
      }
    )

    let hubIsAvailable = SPDataAdapter.portalDataService?.isAvailable ?? false
    const columns = hubIsAvailable ? await SPDataAdapter.portalDataService.getProjectColumns() : []

    hubIsAvailable = SPDataAdapter.portalDataService?.isAvailable ?? false

    const [reports, sections, columnConfig] = hubIsAvailable
      ? await fetchProjectStatusReportData(context)
      : [[], [], []]

    // Hub-dependent calls are wrapped individually with safe fallbacks
    // so that external users without hub access can still see local project data.
    const templateName = projectInformationData.fieldValues.get('GtProjectTemplate', {
      format: 'text'
    })

    const [parentProjects, childProjects, archiveStatus, template] = await Promise.all([
      isFrontpage && hubIsAvailable
        ? safeCall(
            () =>
              SPDataAdapter.portalDataService.getParentProjects(
                context.props.webAbsoluteUrl,
                ProjectInformationParentProject
              ),
            []
          )
        : Promise.resolve([]),
      isFrontpage && hubIsAvailable
        ? safeCall(
            () =>
              SPDataAdapter.portalDataService.getChildProjects(
                context.props.webAbsoluteUrl,
                ProjectInformationChildProject
              ),
            []
          )
        : Promise.resolve([]),
      shouldFetchArchiveStatus && hubIsAvailable
        ? safeCall(() => SPDataAdapter.getArchiveStatus(context.props.webAbsoluteUrl), null)
        : Promise.resolve(null),
      hubIsAvailable
        ? safeCall(() => SPDataAdapter.portalDataService.getProjectTemplate(templateName), null)
        : Promise.resolve(null)
    ])

    const data: Partial<IProjectInformationState> = {
      data: {
        columns,
        parentProjects,
        childProjects,
        reports,
        sections,
        columnConfig,
        template,
        archiveStatus,
        ...projectInformationData
      },
      hubIsAvailable,
      userHasEditPermission: false,
      userHasRerunSetupPermission: false
    }
    if (isFrontpage && hubIsAvailable) {
      data.userHasEditPermission = await safeCall(
        () =>
          SPDataAdapter.checkProjectAdminPermissions(
            ProjectAdminPermission.EditProjectProperties,
            projectInformationData.fieldValues
          ),
        false
      )
      data.userHasRerunSetupPermission = await safeCall(
        () =>
          SPDataAdapter.checkProjectAdminPermissions(
            ProjectAdminPermission.ReRunSetup,
            projectInformationData.fieldValues
          ),
        false
      )
    } else if (isFrontpage) {
      const hasManageWeb = await safeCall(
        () => SPDataAdapter.sp.web.currentUserHasPermissions(PermissionKind.ManageWeb),
        false
      )
      data.userHasEditPermission = hasManageWeb
      data.userHasRerunSetupPermission = hasManageWeb
    }
    return data
  } catch (error) {
    void ListLogger.log({
      message: error.message,
      level: 'Error',
      functionName: 'fetchData',
      component: ProjectInformation.displayName
    })
    // The cause lets the hook count the failure by the status SharePoint answered with.
    throw errorWithCause(strings.ProjectInformationDataFetchErrorText, error)
  }
}

/**
 * Configures the adapter and reloads project information after property updates. A fetch that
 * fails is counted for usage statistics, by its error code, for the web part the component is in.
 */
export const useProjectInformationDataFetch = (context: IProjectInformationContext) => {
  const telemetry = useTelemetry()
  useEffect(() => {
    void SPDataAdapter.configure(context.props.spfxContext, {
      siteId: context.props.siteId,
      webUrl: context.props.webAbsoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    }).then(() => {
      fetchData(context)
        .then((state) => context.dispatch(INIT_DATA({ state })))
        .catch((e) => {
          telemetry.trackError(e)
          const error = CustomError.createError(e, 'error')
          context.dispatch(FETCH_DATA_ERROR({ error }))
        })
    })
  }, [context.state.propertiesLastUpdated, context.props.siteId])
}
