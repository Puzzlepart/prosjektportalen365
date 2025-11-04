import {
  BoxEdit24Filled,
  BoxEdit24Regular,
  ContentView24Filled,
  ContentView24Regular,
  History24Filled,
  History24Regular,
  Info24Filled,
  Info24Regular,
  Organization24Filled,
  Organization24Regular,
  bundleIcon
} from '@fluentui/react-icons'
import { DisplayMode } from '@microsoft/sp-core-library'
import strings from 'ProjectWebPartsStrings'
import { useProjectInformationContext } from '../context'
import { OPEN_DIALOG, OPEN_PANEL } from '../reducer'
import { ActionType } from './types'
import { format } from '@fluentui/react'

/**
 * Logic hook for `<Actions />` component.
 */
export const useActions = () => {
  const context = useProjectInformationContext()
  if (context.props.hideAllActions || context.props.displayMode === DisplayMode.Edit) return []
  const showAllProjectInformationAction: ActionType = [
    format(strings.ShowAllProjectInformationText, context.props.title?.toLowerCase()),
    () => {
      context.dispatch(OPEN_PANEL('AllPropertiesPanel'))
    },
    bundleIcon(ContentView24Filled, ContentView24Regular),
    false
  ]
  const viewVersionHistoryAction: ActionType = [
    strings.ViewVersionHistoryText,
    context.state.data?.versionHistoryUrl,
    bundleIcon(History24Filled, History24Regular),
    false,
    !context.state.userHasEditPermission
  ]
  const editProjectInformationAction: ActionType = [
    format(strings.EditProjectInformationText, context.props.title?.toLowerCase()),
    () => {
      context.dispatch(OPEN_PANEL('EditPropertiesPanel'))
    },
    bundleIcon(BoxEdit24Filled, BoxEdit24Regular),
    false,
    !context.state.userHasEditPermission
  ]
  const editSiteInformationAction: ActionType = [
    strings.EditSiteInformationText,
    window['_spLaunchSiteSettings'],
    bundleIcon(Info24Filled, Info24Regular),
    false,
    !window['_spLaunchSiteSettings'] || !context.state.userHasEditPermission
  ]
  const administerChildrenAction: ActionType = [
    strings.ChildProjectAdminLabel,
    () => {
      window.location.href = `${context.props.webServerRelativeUrl}/SitePages/${context.props.adminPageLink}`
    },
    bundleIcon(Organization24Filled, Organization24Regular),
    false,
    !context.state.userHasEditPermission
  ]
  const transformToParentProject: ActionType = [
    strings.CreateParentProjectLabel,
    () => {
      context.dispatch(OPEN_DIALOG('CreateParentDialog'))
    },
    bundleIcon(Organization24Filled, Organization24Regular),
    false,
    !context.state.userHasEditPermission
  ]
  const actionsMap: Record<string, ActionType> = {
    showAllProjectInformationAction,
    viewVersionHistoryAction,
    editProjectInformationAction,
    editSiteInformationAction,
    administerChildrenAction: context.state.isParentProject ? administerChildrenAction : null,
    transformToParentProject: !context.state.isParentProject ? transformToParentProject : null
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
