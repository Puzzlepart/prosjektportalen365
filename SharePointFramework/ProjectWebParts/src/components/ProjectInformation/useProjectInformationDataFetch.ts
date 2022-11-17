import { MessageBarType } from '@fluentui/react'
import _ from 'lodash'
import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import { ListLogger } from 'pp365-shared/lib/logging'
import strings from 'ProjectWebPartsStrings'
import { useEffect } from 'react'
import { isEmpty } from 'underscore'
import { ProjectInformation } from '.'
import SPDataAdapter from '../../data'
import { DataFetchFunction } from '../../types/DataFetchFunction'
import { ProjectPropertyModel } from './ProjectProperties/ProjectProperty'
import {
  IProjectInformationData,
  IProjectInformationProps,
  IProjectInformationState,
  ProjectInformationParentProject
} from './types'

/**
 * Transform properties to model `ProjectPropertyModel`
 *
 * @param data Data
 * @param props Component properties for `ProjectInformation`
 * @param useVisibleFilter Use visible filter
 */
const transformProperties = (
  data: IProjectInformationData,
  props: IProjectInformationProps,
  useVisibleFilter: boolean = true
) => {
  const fieldNames: string[] = Object.keys(data.fieldValuesText).filter((fieldName) => {
    const [field] = data.fields.filter((fld) => fld.InternalName === fieldName)
    if (!field) return false
    if (
      isEmpty(data.columns) &&
      ((props.showFieldExternal || {})[fieldName] || props.skipSyncToHub)
    ) {
      return true
    }
    const [column] = data.columns.filter((c) => c.internalName === fieldName)
    return column ? (useVisibleFilter ? column.isVisible(props.page) : true) : false
  })

  const properties = fieldNames.map((fn) => {
    const [field] = data.fields.filter((fld) => fld.InternalName === fn)
    return new ProjectPropertyModel(field, data.fieldValuesText[fn])
  })
  return properties
}

/**
 * Checks if project data is synced
 */
const checkProjectDataSynced: DataFetchFunction<IProjectInformationProps, boolean> = async (props) => {
  try {
    let isSynced = false
    const projectDataList = props.hubSite.web.lists.getByTitle(strings.IdeaProjectDataTitle)
    const [projectDataItem] = await projectDataList.items
      .filter(`GtSiteUrl eq '${props.spfxContext.pageContext.web.absoluteUrl}'`)
      .select('Id')
      .get()
    const ideaProcessingList = props.hubSite.web.lists.getByTitle(strings.IdeaProcessingTitle)
    const [ideaProcessingItem] = await ideaProcessingList.items
      .filter(`GtIdeaProjectDataId eq '${projectDataItem.Id}'`)
      .select('Id, GtIdeaDecision')
      .get()
    if (ideaProcessingItem.GtIdeaDecision === 'Godkjent og synkronisert') {
      isSynced = true
    }
    return isSynced
  } catch (error) {
    return true
  }
}

/**
 * Fetch data for `ProjectInformation`
 */
const fetchData: DataFetchFunction<IProjectInformationProps, Partial<IProjectInformationState>> = async (
  props
) => {
  try {
    const [
      columns,
      propertiesData,
      parentProjects,
      reports,
      sections,
      columnConfig
    ] = await Promise.all([
      SPDataAdapter.portal.getProjectColumns(),
      SPDataAdapter.project.getPropertiesData(),
      props.page === 'Frontpage'
        ? SPDataAdapter.portal.getParentProjects(
          props.spfxContext?.pageContext?.web?.absoluteUrl,
          ProjectInformationParentProject
        )
        : Promise.resolve([]),
      props.hideStatusReport
        ? Promise.resolve([])
        : SPDataAdapter.portal.getStatusReports({
          filter: `(GtSiteId eq '${props.siteId}') and GtModerationStatus eq '${strings.GtModerationStatus_Choice_Published}'`,
          publishedString: strings.GtModerationStatus_Choice_Published
        }),
      props.hideStatusReport
        ? Promise.resolve([])
        : SPDataAdapter.portal.getProjectStatusSections(),
      props.hideStatusReport ? Promise.resolve([]) : SPDataAdapter.portal.getProjectColumnConfig()
    ])
    const data: IProjectInformationData = {
      columns,
      parentProjects,
      reports,
      sections,
      columnConfig,
      ...propertiesData
    }
    const properties = transformProperties(data, props)
    const allProperties = transformProperties(data, props, false)
    let userHasEditPermission = false
    let isProjectDataSynced = false
    if (props.page === 'Frontpage') {
      userHasEditPermission = await SPDataAdapter.checkProjectAdminPermissions(
        ProjectAdminPermission.EditProjectProperties,
        data.fieldValues
      )
      isProjectDataSynced = props.useIdeaProcessing && (await checkProjectDataSynced(props))
    }
    const isParentProject = data.fieldValues?.GtIsParentProject || data.fieldValues?.GtIsProgram
    return {
      data,
      isParentProject,
      properties,
      allProperties,
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
 * Fetch hook for ProjectInformation
 *
 * @param props Component properties for `ProjectInformation`
 * @param setState Set state function for `ProjectInformation`
 */
export const useProjectInformationDataFetch = (
  props: IProjectInformationProps,
  setState: (newState: Partial<IProjectInformationState>) => void
) => {
  useEffect(() => {
    fetchData(props)
    .then((data) => setState({ ...data, isDataLoaded: true }))
    .catch((error) =>  setState({
      isDataLoaded: true,
      error: { ..._.pick(error, 'message', 'stack'), type: MessageBarType.severeWarning }
    }))
  }, [])
}