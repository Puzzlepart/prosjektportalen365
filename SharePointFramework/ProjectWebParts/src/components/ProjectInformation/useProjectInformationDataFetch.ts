import { LogLevel } from '@pnp/logging'
import strings from 'ProjectWebPartsStrings'
import { ProjectAdminPermission } from 'pp365-shared-library/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import { ProjectColumnConfig, SectionModel, StatusReport } from 'pp365-shared-library/lib/models'
import { CustomError } from 'pp365-shared-library/lib/models'
import { useEffect } from 'react'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { ProjectInformationParentProject } from './ProjectInformationParentProject'
import { IProjectInformationContext } from './context'
import { IProjectInformationData, IProjectInformationState } from './types'
import { usePropertiesTransform } from './usePropertiesTransform'
import { MessageBarType } from '@fluentui/react'

/**
 * Checks if project data is synced
 *
 * @param context Context for `ProjectInformation`
 */
const checkProjectDataSynced: DataFetchFunction<IProjectInformationContext, boolean> = async (
  context
) => {
  try {
    let isSynced = false
    const projectDataList = SPDataAdapter.portal.web.lists.getByTitle(strings.IdeaProjectDataTitle)
    const [projectDataItem] = await projectDataList.items
      .filter(`GtSiteUrl eq '${context.props.webPartContext.pageContext.web.absoluteUrl}'`)
      .select('Id')()

    const [ideaConfig] = (await SPDataAdapter.getIdeaConfiguration()).filter(
      (item) => item.title === context.props.ideaConfiguration
    )

    const ideaProcessingList = SPDataAdapter.portal.web.lists.getByTitle(ideaConfig.processingList)

    const [ideaProcessingItem] = await ideaProcessingList.items
      .filter(`GtIdeaProjectDataId eq '${projectDataItem.Id}'`)
      .select('Id, GtIdeaDecision')()
    if (ideaProcessingItem.GtIdeaDecision === 'Godkjent og synkronisert') {
      isSynced = true
    }
    return isSynced
  } catch (error) {
    return true
  }
}

/**
 * Fetch project status reports (top: 1), sections and column config  if `props.hideStatusReport` is false.
 * Catches errors and returns empty arrays to support e.g. the case where the user does not have
 * access to the hub site.
 *
 * @param context Context for `ProjectInformation`
 */
const fetchProjectStatusReports: DataFetchFunction<
  IProjectInformationContext,
  [StatusReport[], SectionModel[], ProjectColumnConfig[]]
> = async (context) => {
  if (context.props.hideStatusReport) {
    return [[], [], []]
  }
  try {
    const [reports, sections, columnConfig] = await Promise.all([
      SPDataAdapter.portal.getStatusReports({
        filter: `(GtSiteId eq '${context.props.siteId}') and GtModerationStatus eq '${strings.GtModerationStatus_Choice_Published}'`,
        publishedString: strings.GtModerationStatus_Choice_Published,
        top: 1
      }),
      SPDataAdapter.portal.getProjectStatusSections(),
      SPDataAdapter.portal.getProjectColumnConfig()
    ])
    return [reports, sections, columnConfig]
  } catch (error) {
    return [[], [], []]
  }
}

/**
 * Fetch data for `ProjectInformation` component. This function is used in
 * `useProjectInformationDataFetch` hook.
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
    if (!SPDataAdapter.isConfigured) {
      await SPDataAdapter.configure(context.props.webPartContext, {
        siteId: context.props.siteId,
        webUrl: context.props.webUrl,
        logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
      })
    }
    const isFrontpage = context.props.page === 'Frontpage'
    const [columns, propertiesData, parentProjects, [reports, sections, columnConfig]] =
      await Promise.all([
        SPDataAdapter.portal.getProjectColumns(),
        SPDataAdapter.project.getPropertiesData(),
        isFrontpage
          ? SPDataAdapter.portal.getParentProjects(
              context.props.webPartContext?.pageContext?.web?.absoluteUrl,
              ProjectInformationParentProject
            )
          : Promise.resolve([]),
        fetchProjectStatusReports(context)
      ])
    const data: IProjectInformationData = {
      columns,
      parentProjects,
      reports,
      sections,
      columnConfig,
      ...propertiesData
    }
    let userHasEditPermission = false
    let isProjectDataSynced = false
    if (isFrontpage) {
      userHasEditPermission = await SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.EditProjectProperties,
        data.fieldValues
      )
      isProjectDataSynced =
        context.props.useIdeaProcessing && (await checkProjectDataSynced(context))
    }
    return {
      data,
      isParentProject: data.fieldValues?.GtIsParentProject || data.fieldValues?.GtIsProgram,
      userHasEditPermission,
      isProjectDataSynced
    }
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
  const transformProperties = usePropertiesTransform(context)
  useEffect(() => {
    fetchData(context)
      .then(transformProperties)
      .then((data) => context.setState({ ...data, isDataLoaded: true }))
      .catch((e) => {
        context.setState({
          isDataLoaded: true,
          error: CustomError.createError(e, MessageBarType.severeWarning)
        })
      })
  }, [context.state.propertiesLastUpdated])
}
