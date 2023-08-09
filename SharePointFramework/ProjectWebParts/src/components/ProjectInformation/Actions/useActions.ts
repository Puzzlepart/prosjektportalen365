import { DisplayMode } from '@microsoft/sp-core-library'
import strings from 'ProjectWebPartsStrings'
import { useProjectInformationContext } from '../context'
import { ActionType } from './types'

/**
 * Logic hook for `<Actions />` component.
 */
export const useActions = () => {
  const context = useProjectInformationContext()
  if (context.props.hideAllActions || context.props.displayMode === DisplayMode.Edit) return []
  const showAllProjectInformationAction: ActionType = [
    strings.ShowAllProjectInformationText,
    () => {
      context.setState({ displayAllPropertiesPanel: true })
    },
    'EntryView',
    false
  ]
  const viewVersionHistoryAction: ActionType = [
    strings.ViewVersionHistoryText,
    context.state.data?.versionHistoryUrl,
    'History',
    false,
    !context.state.userHasEditPermission
  ]
  const editProjectInformationAction: ActionType = [
    strings.EditProjectInformationText,
    () => {
      context.setState({ displayEditPropertiesPanel: true })
    },
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
      context.setState({ displayCreateParentDialog: true })
    },
    'Org',
    false,
    !context.state.userHasEditPermission
  ]
  const syncProjectPropertiesAction: ActionType = [
    strings.SyncProjectPropertiesText,
    () => {
      context.setState({ displaySyncProjectDialog: true })
    },
    'Sync',
    false,
    !context.props.useIdeaProcessing ||
      context.state.isProjectDataSynced ||
      !context.state.userHasEditPermission
  ]
  const actionsMap: Record<string, ActionType> = {
    showAllProjectInformationAction,
    viewVersionHistoryAction,
    editProjectInformationAction,
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
