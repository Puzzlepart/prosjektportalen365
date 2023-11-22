import {
  AppsListFilled,
  AppsListRegular,
  ChevronLeftFilled,
  ChevronLeftRegular,
  ContentView24Filled,
  ContentView24Regular,
  EditFilled,
  EditRegular,
  FormNewFilled,
  FormNewRegular,
  TextBulletListLtrFilled,
  TextBulletListLtrRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, ListMenuItemDivider, ListMenuItemHeader } from 'pp365-shared-library'
import { useMemo } from 'react'
import _ from 'underscore'
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
  AppsList: bundleIcon(AppsListFilled, AppsListRegular),
  TextBulletList: bundleIcon(TextBulletListLtrFilled, TextBulletListLtrRegular),
  ChevronLeft: bundleIcon(ChevronLeftFilled, ChevronLeftRegular),
  FormNew: bundleIcon(FormNewFilled, FormNewRegular),
  Edit: bundleIcon(EditFilled, EditRegular)
}

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The `IPortfolioOverviewContext` object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of `IListMenuItem` objects representing the toolbar items.
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
      renderMode: context.state.isCompact ? ['compactList'] : ['list']
    }),
    [context.state.currentView?.id, context.state.isCompact]
  )

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(null, strings.ExcelExportButtonLabel)
          .setIcon('ExcelLogoInverse')
          .setOnClick(exportToExcel)
          .setStyle({
            color: '#10793F'
          }),
        new ListMenuItem(context.state.currentView?.title, strings.PortfolioViewsListName)
          .setIcon(Icons.ContentView)
          .setWidth('fit-content')
          .setStyle({ minWidth: '145px' })
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
                .setIcon(Icons.ChevronLeft)
                .makeConditional(!_.isEmpty(programViews)),
              ListMenuItemDivider.makeConditional(!_.isEmpty(programViews)),
              userCanManageViews &&
                new ListMenuItem(strings.NewViewText).setIcon(Icons.FormNew).setOnClick(() => {
                  context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
                }),
              userCanManageViews &&
                new ListMenuItem(strings.EditViewText)
                .setIcon(Icons.Edit)
                .setOnClick(() => {
                  context.dispatch(
                    SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                  )
                })
            ],
            checkedValues
          ),
        new ListMenuItem(null, strings.FilterText).setIcon('Filter').setOnClick(() => {
          context.dispatch(TOGGLE_FILTER_PANEL())
        })
      ].filter(Boolean),
    [context.state, context.props]
  )

  return menuItems
}
