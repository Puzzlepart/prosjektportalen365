import { ProjectAdminPermission } from 'pp365-shared/lib/data/SPDataAdapterBase/ProjectAdminPermission'
import strings from 'ProjectWebPartsStrings'
import { useEffect } from 'react'
import { isEmpty } from 'underscore'
import SPDataAdapter from '../../data'
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
 *
 * @param props Component properties for `ProjectInformation`
 */
const projectDataSynced = async (props: IProjectInformationProps) => {
  try {
    let isSynced = false
    const projectDataList = props.hubSite.web.lists.getByTitle(strings.IdeaProjectDataTitle)
    const [projectDataItem] = await projectDataList.items
      .filter(`GtSiteUrl eq '${props.webPartContext.pageContext.web.absoluteUrl}'`)
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
 * Fetch data for ProjectInformation
 *
 * @param props Component properties for `ProjectInformation`
 */
const fetchData = async (
  props: IProjectInformationProps
): Promise<Partial<IProjectInformationState>> => {
  try {
    const [columns, propertiesData, parentProjects] = await Promise.all([
      SPDataAdapter.portal.getProjectColumns(),
      SPDataAdapter.project.getPropertiesData(),
      props.page === 'Frontpage'
        ? SPDataAdapter.portal.getParentProjects(
            props.webPartContext?.pageContext?.web?.absoluteUrl,
            ProjectInformationParentProject
          )
        : Promise.resolve([])
    ])
    const data: IProjectInformationData = {
      columns,
      parentProjects,
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
      isProjectDataSynced = props.useIdeaProcessing && (await projectDataSynced(props))
    }
    return {
      data,
      isParentProject: data.fieldValues?.GtIsParentProject || data.fieldValues?.GtIsProgram,
      properties,
      allProperties,
      userHasEditPermission,
      isProjectDataSynced
    }
  } catch (error) {
    throw error
  }
}

/**
 * Fetch hook for ProjectInformation
 *
 * @param props Component properties for `ProjectInformation`
 * @param fetchCallback Fetch callback
 */
export const useProjectInformationDataFetch = (
  props: IProjectInformationProps,
  fetchCallback: (data: Partial<IProjectInformationState>) => void
) => {
  useEffect(() => {
    fetchData(props).then(fetchCallback)
  }, [])
}
