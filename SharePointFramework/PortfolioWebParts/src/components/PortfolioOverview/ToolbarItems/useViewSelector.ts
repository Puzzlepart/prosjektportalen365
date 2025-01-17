import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, ListMenuItemHeader } from 'pp365-shared-library'
import { useMemo } from 'react'
import _ from 'underscore'
import { IPortfolioOverviewContext } from '../context'
import { SET_VIEW_FORM_PANEL, TOGGLE_COMPACT } from '../reducer'
import { Icons } from './icons'
import { useProgramMenuItems } from './useProgramMenuItems'
import { useViewsMenuItems } from './useViewsMenuItems'


/**
 * Hook for generating the view selector menu item.
 * 
 * @param context - The `IPortfolioOverviewContext` object containing the necessary data for generating the view selector menu item.
 */
export function useViewSelector(context: IPortfolioOverviewContext) {
  const userCanManageViews = context.props.configuration.userCanAddViews
  const userCanEditGlobalViews = userCanManageViews && context.props.isSiteAdmin
  const userEmail = context.props.pageContext.user.email ?? context.props.pageContext.user.loginName
  const userCanEditView = userCanManageViews && context.state.currentView?.author === userEmail
  const sharedViews = useViewsMenuItems(context, (view) => !view.isPersonal)
  const personalViews = useViewsMenuItems(context, (view) => view.isPersonal)
  const programViews = useProgramMenuItems(context)

  return useMemo<ListMenuItem>(
    () => new ListMenuItem(context.state.currentView?.title, strings.PortfolioViewsListName)
      .setIcon(Icons.ContentView)
      .setWidth('fit-content')
      .setStyle({
        minWidth: '145px',
        display: context.props.showViewSelector ? 'flex' : 'none'
      })
      .setDisabled(context.state.isChangingView)
      .setItems(
        [
          new ListMenuItem(strings.ListViewText)
            .setIcon(Icons.AppsList)
            .makeCheckable({
              name: 'renderMode',
              value: 'list'
            })
            .setOnClick(() => {
              context.dispatch(TOGGLE_COMPACT())
            }),
          new ListMenuItem(strings.CompactViewText)
            .setIcon(Icons.TextBulletList)
            .makeCheckable({
              name: 'renderMode',
              value: 'compactList'
            })
            .setOnClick(() => {
              context.dispatch(TOGGLE_COMPACT())
            }),
          ListMenuItemDivider,
          ...sharedViews,
          !_.isEmpty(personalViews) && ListMenuItemDivider,
          ListMenuItemHeader(strings.PersonalViewsHeaderText).makeConditional(
            !_.isEmpty(personalViews)
          ),
          ...personalViews,
          context.props.showProgramViews && ListMenuItemDivider,
          context.props.showProgramViews &&
          ListMenuItemHeader(strings.ProgramsHeaderText).setStyle({
            display:
              context.props.showProgramViews && !_.isEmpty(programViews) ? 'flex' : 'none'
          }),
          new ListMenuItem(strings.SelectProgramText)
            .setItems(programViews)
            .setIcon(Icons.ChevronLeft)
            .setStyle({
              display:
                context.props.showProgramViews && !_.isEmpty(programViews) ? 'flex' : 'none'
            }),
          ListMenuItemDivider.setStyle({
            display:
              context.props.showProgramViews && !_.isEmpty(programViews) ? 'flex' : 'none'
          }),
          new ListMenuItem(strings.NewViewText)
            .setDisabled(!userCanManageViews)
            .setIcon(Icons.FormNew)
            .setOnClick(() => {
              context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
            }),
          new ListMenuItem(strings.EditViewText)
            .setDisabled(!userCanEditView && !userCanEditGlobalViews)
            .setIcon(Icons.Edit)
            .setOnClick(() => {
              context.dispatch(
                SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
              )
            })
        ],
        {
          views: [context.state.currentView?.id.toString()],
          renderMode: context.state.isCompact ? ['compactList'] : ['list']
        }
      ),
    [context.state.currentView, context.state.isChangingView, context.state.isCompact, programViews]
  )
}
