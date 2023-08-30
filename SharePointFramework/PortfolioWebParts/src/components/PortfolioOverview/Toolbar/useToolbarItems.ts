import {
  AppsListFilled,
  AppsListRegular,
  ContentView24Filled,
  ContentView24Regular,
  Filter24Filled,
  Filter24Regular,
  TextBulletListLtrFilled,
  TextBulletListLtrRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { useMemo } from 'react'
import _ from 'underscore'
import { ListMenuItem, ListMenuItemDivider, ListMenuItemHeader } from '../../List'
import { IPortfolioOverviewContext } from '../context'
import { SET_VIEW_FORM_PANEL, TOGGLE_COMPACT, TOGGLE_FILTER_PANEL } from '../reducer'
import { useExcelExport } from './useExcelExport'
import { useProgramMenuItems } from './useProgramMenuItems'
import { useViewsMenuItems } from './useViewsMenuItems'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular),
  Filter: bundleIcon(Filter24Filled, Filter24Regular),
  AppsList: bundleIcon(AppsListFilled, AppsListRegular),
  TextBulletList: bundleIcon(TextBulletListLtrFilled, TextBulletListLtrRegular)
}

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The IPortfolioOverviewContext object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(context: IPortfolioOverviewContext) {
  const userCanManageViews =
    !context.props.isParentProject && context.props.configuration.userCanAddViews

  const { exportToExcel } = useExcelExport(context)
  const sharedViews = useViewsMenuItems(context, (view) => !view.isPersonal)
  const personalViews = useViewsMenuItems(context, (view) => view.isPersonal)
  const programViews = useProgramMenuItems(context)
  const checkedValues = useMemo(
    () => ({
      views: [context.state.currentView?.id.toString()],
      renderMode: context.state.isCompact ? ['compactList'] : ['list'],
      programs: [context.state.currentView?.id.toString()]
    }),
    [context.state.currentView?.id, context.state.isCompact]
  )

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem().setIcon('ExcelLogoInverse').setOnClick(exportToExcel).setStyle({
          color: '#008000'
        }),
        new ListMenuItem(context.state.currentView?.title)
          .setIcon(Icons.ContentView)
          .setWidth(220)
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
              ListMenuItemDivider,
              ListMenuItemHeader(strings.PersonalViewsHeaderText).makeConditional(
                !_.isEmpty(personalViews)
              ),
              ...personalViews,
              ListMenuItemDivider,
              ListMenuItemHeader(strings.ProgramsHeaderText).makeConditional(
                !_.isEmpty(programViews)
              ),
              new ListMenuItem(strings.SelectProgramText)
                .setItems(programViews)
                .makeConditional(!_.isEmpty(programViews)),
              ListMenuItemDivider.makeConditional(!_.isEmpty(programViews)),
              userCanManageViews &&
                new ListMenuItem(strings.NewViewText).setOnClick(() => {
                  context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
                }),
              userCanManageViews &&
                new ListMenuItem(strings.EditViewText).setOnClick(() => {
                  context.dispatch(
                    SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                  )
                })
            ],
            checkedValues
          ),
        new ListMenuItem().setIcon(Icons.Filter).setOnClick(() => {
          context.dispatch(TOGGLE_FILTER_PANEL())
        })
      ].filter(Boolean),
    [context.state, context.props]
  )

  return menuItems
}
