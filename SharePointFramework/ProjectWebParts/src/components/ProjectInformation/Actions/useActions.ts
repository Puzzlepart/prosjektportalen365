import { DisplayMode } from '@microsoft/sp-core-library'
import strings from 'ProjectWebPartsStrings'
import { useContext } from 'react'
import { ProjectInformationContext } from '../context'
import { ActionType } from './types'

export const useActions = () => {
  const context = useContext(ProjectInformationContext)
  if (context.props.hideAllActions || context.props.displayMode === DisplayMode.Edit) return []
  const viewAllPropertiesAction: ActionType = [
    strings.ViewAllPropertiesLabel,
    () => {
      context.setState({ showProjectPropertiesPanel: true })
    },
    'EntryView',
    false,
    context.props.hideViewAllPropertiesButton
  ]
  const viewVersionHistoryAction: ActionType = [
    strings.ViewVersionHistoryText,
    context.state.data.versionHistoryUrl,
    'History',
    false,
    !context.state.userHasEditPermission
  ]
  const editPropertiesAction: ActionType = [
    strings.EditPropertiesText,
    context.state.data.editFormUrl,
    'Edit',
    false,
    !context.state.userHasEditPermission
  ]
  const editSiteInformationAction: ActionType = [
    strings.EditSiteInformationText,
    window['_spLaunchSiteSettings'],
    'Info',
    false,
    !window['_spLaunchSiteSettings'] || !context.state.userHasEditPermission
  ]
  const administerChildrenAction: ActionType = [
    strings.ChildProjectAdminLabel,
    () => {
      window.location.href = `${context.props.webPartContext.pageContext.web.serverRelativeUrl}/SitePages/${context.props.adminPageLink}`
    },
    'Org',
    false,
    !context.state.userHasEditPermission
  ]
  const transformToParentProject: ActionType = [
    strings.CreateParentProjectLabel,
    () => {
      context.setState({ displayParentCreationModal: true })
    },
    'Org',
    false,
    !context.state.userHasEditPermission
  ]
  const syncProjectPropertiesAction: ActionType = [
    strings.SyncProjectPropertiesText,
    () => {
      context.setState({ displaySyncProjectModal: true })
    },
    'Sync',
    false,
    !context.props.useIdeaProcessing ||
      context.state.isProjectDataSynced ||
      !context.state.userHasEditPermission
  ]
  const actionsMap: Record<string, ActionType> = {
    viewAllPropertiesAction,
    viewVersionHistoryAction,
    editPropertiesAction,
    editSiteInformationAction,
    administerChildrenAction: context.state.isParentProject ? administerChildrenAction : null,
    transformToParentProject: !context.state.isParentProject ? transformToParentProject : null,
    syncProjectPropertiesAction
  }
  const actions = Object.keys(actionsMap)
    .map((action) => {
      if (actionsMap[action] && !context.props.hideActions.includes(action))
        return actionsMap[action]
      else return null
    })
    .filter(Boolean)
  return [...actions, ...context.props.customActions]
}
