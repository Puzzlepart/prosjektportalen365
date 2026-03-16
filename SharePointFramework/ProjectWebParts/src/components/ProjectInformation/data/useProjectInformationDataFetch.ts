import { MessageBarType } from '@fluentui/react'
import { LogLevel } from '@pnp/logging'
import { PermissionKind } from '@pnp/sp/presets/all'
import strings from 'ProjectWebPartsStrings'
import {
  CustomError,
  ListLogger,
  ProjectAdminPermission,
  ProjectInformationParentProject,
  ProjectInformationChildProject
} from 'pp365-shared-library'
import { useEffect } from 'react'
import SPDataAdapter from '../../../data'
import { DataFetchFunction } from '../../../types/DataFetchFunction'
import { IProjectInformationContext } from '../context'
import { ProjectInformation } from '../index'
import { FETCH_DATA_ERROR, INIT_DATA } from '../reducer'
import { IProjectInformationState } from '../types'
import { fetchProjectStatusReportData } from './fetchProjectStatusReportData'

/**
 * Fetch data for `ProjectInformation` component. This function is used in
 * `useProjectInformationDataFetch` hook. Data are fetched using the following
 * functions:
 *
 * - `SPDataAdapter.portalDataService.getProjectColumns` - fetches project columns
 * - `SPDataAdapter.project.getProjectInformationData` - fetches project properties data
 * - `SPDataAdapter.portalDataService.getParentProjects` - fetches parent projects (only on frontpage)
 * - `SPDataAdapter.portalDataService.getChildProjects` - fetches child projects (only on frontpage)
 * - `SPDataAdapter.getArchiveStatus` - fetches archive status information (only on frontpage)
 * - `fetchProjectStatusReportData` - fetches project status reports, sections and column config
 *
 * @remarks Ensures that `SPDataAdapter` is configured before fetching data.
 * Normally the `SPDataAdapter` is not configured  if the component is used in
 * a web part in a different SharePoint Framework solution like for instance
 * `PortfolioWebParts`.
 *
 * @param context Context for `ProjectInformation`
 * @param transformProperties Function for transforming the properties
 */
/**
 * Safely execute a function, returning a fallback value if it throws.
 * Used to wrap hub-dependent calls so that external users without
 * hub access can still see local project data.
 */
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

const fetchData: DataFetchFunction<
  IProjectInformationContext,
  Partial<IProjectInformationState>
> = async (context) => {
  try {
    const isFrontpage = context.props.page === 'Frontpage'
    const shouldFetchArchiveStatus = isFrontpage && !context.props.hideArchiveStatus
    const projectInformationData = await SPDataAdapter.project.getProjectInformationData()

    let hubIsAvailable = SPDataAdapter.portalDataService?.isAvailable ?? false
    const columns = hubIsAvailable
      ? await SPDataAdapter.portalDataService.getProjectColumns()
      : []

    hubIsAvailable = SPDataAdapter.portalDataService?.isAvailable ?? false

    const [reports, sections, columnConfig] = hubIsAvailable
      ? await fetchProjectStatusReportData(context)
      : [[], [], []]

    // Hub-dependent calls are wrapped individually with safe fallbacks
    // so that external users without hub access can still see local project data.
    const parentProjects =
      isFrontpage && hubIsAvailable
        ? await safeCall(
            () =>
              SPDataAdapter.portalDataService.getParentProjects(
                context.props.webAbsoluteUrl,
                ProjectInformationParentProject
              ),
            []
          )
        : []

    const childProjects =
      isFrontpage && hubIsAvailable
        ? await safeCall(
            () =>
              SPDataAdapter.portalDataService.getChildProjects(
                context.props.webAbsoluteUrl,
                ProjectInformationChildProject
              ),
            []
          )
        : []

    const archiveStatus =
      shouldFetchArchiveStatus && hubIsAvailable
        ? await safeCall(
            () => SPDataAdapter.getArchiveStatus(context.props.webAbsoluteUrl),
            null
          )
        : null

    const templateName = projectInformationData.fieldValues.get('GtProjectTemplate', {
      format: 'text'
    })
    const template = hubIsAvailable
      ? await safeCall(
          () => SPDataAdapter.portalDataService.getProjectTemplate(templateName),
          null
        )
      : null

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
    ListLogger.log({
      message: error.message,
      level: 'Error',
      functionName: 'fetchData',
      component: ProjectInformation.displayName
    })
    throw new Error(strings.ProjectInformationDataFetchErrorText)
  }
}

/**
 * Fetch hook for ProjectInformation. Fetches data for `ProjectInformation` component
 * using `fetchData` function together with React `useEffect` hook. The data is re-fetched
 * when `context.state.propertiesLastUpdated` changes.
 *
 * @param context Context for `ProjectInformation`
 */
export const useProjectInformationDataFetch = (context: IProjectInformationContext) => {
  useEffect(() => {
    SPDataAdapter.configure(context.props.spfxContext, {
      siteId: context.props.siteId,
      webUrl: context.props.webAbsoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    }).then(() => {
      fetchData(context)
        .then((state) => context.dispatch(INIT_DATA({ state })))
        .catch((e) => {
          const error = CustomError.createError(e, MessageBarType.severeWarning)
          context.dispatch(FETCH_DATA_ERROR({ error }))
        })
    })
  }, [context.state.propertiesLastUpdated, context.props.siteId])
}
