import { MessageBarType } from '@fluentui/react'
import { LogLevel } from '@pnp/logging'
import strings from 'ProjectWebPartsStrings'
import {
  CustomError,
  ListLogger,
  ProjectAdminPermission,
  ProjectInformationParentProject
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
 * - `SPDataAdapter.portal.getProjectColumns` - fetches project columns
 * - `SPDataAdapter.project.getProjectInformationData` - fetches project properties data
 * - `SPDataAdapter.portal.getParentProjects` - fetches parent projects (only on frontpage)
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
const fetchData: DataFetchFunction<
  IProjectInformationContext,
  Partial<IProjectInformationState>
> = async (context) => {
  try {
    const isFrontpage = context.props.page === 'Frontpage'
    const [columns, projectInformationData, [reports, sections, columnConfig], parentProjects] =
      await Promise.all([
        SPDataAdapter.portal.getProjectColumns(),
        SPDataAdapter.project.getProjectInformationData(),
        fetchProjectStatusReportData(context),
        isFrontpage
          ? SPDataAdapter.portal.getParentProjects(
              context.props.webAbsoluteUrl,
              ProjectInformationParentProject
            )
          : Promise.resolve([])
      ])
    const templateName = projectInformationData.fieldValues.get('GtProjectTemplate', {
      format: 'text'
    })
    const template = await SPDataAdapter.portal.getProjectTemplate(templateName)
    const data: Partial<IProjectInformationState> = {
      data: {
        columns,
        parentProjects,
        reports,
        sections,
        columnConfig,
        template,
        ...projectInformationData
      },
      userHasEditPermission: false
    }
    if (isFrontpage) {
      data.userHasEditPermission = await SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.EditProjectProperties,
        projectInformationData.fieldValues
      )
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
