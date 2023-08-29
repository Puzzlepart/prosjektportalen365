import {
  AppsListRegular,
  ContentView24Filled,
  ContentView24Regular,
  Filter24Filled,
  Filter24Regular,
  TextBulletListLtrRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { useMemo } from 'react'
import _ from 'underscore'
import { IListMenuItem } from '../../List'
import { IPortfolioOverviewContext } from '../context'
import { TOGGLE_COMPACT, TOGGLE_FILTER_PANEL, SET_VIEW_FORM_PANEL } from '../reducer'
import { useCheckedValues } from './useCheckedValues'
import { useExcelExport } from './useExcelExport'
import { useProgramMenuItems } from './useProgramMenuItems'
import { useViewsMenuItems } from './useViewsMenuItems'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  ContentView: bundleIcon(ContentView24Filled, ContentView24Regular),
  Filter: bundleIcon(Filter24Filled, Filter24Regular)
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
  const checkedValues = useCheckedValues(context)

  const menuItems = useMemo<IListMenuItem[]>(
    () =>
      [
        {
          icon: 'ExcelLogoInverse',
          onClick: () => {
            exportToExcel()
          }
        } as IListMenuItem,
        {
          icon: Icons.ContentView,
          text: context.state.currentView?.title,
          width: 220,
          checkedValues,
          items: [
            {
              text: strings.ListViewText,
              icon: AppsListRegular,
              name: 'renderMode',
              value: 'list',
              onClick: () => {
                context.dispatch(TOGGLE_COMPACT())
              }
            } as IListMenuItem,
            {
              text: strings.CompactViewText,
              icon: TextBulletListLtrRegular,
              name: 'renderMode',
              value: 'compactList',
              onClick: () => {
                context.dispatch(TOGGLE_COMPACT())
              }
            } as IListMenuItem,
            {
              type: 'divider'
            } as IListMenuItem,
            ...sharedViews,
            {
              type: 'divider'
            } as IListMenuItem,
            !_.isEmpty(personalViews) && {
              text: strings.PersonalViewsHeaderText,
              type: 'header'
            },
            ...personalViews,
            {
              type: 'divider'
            } as IListMenuItem,
            ...(_.isEmpty(programViews)
              ? []
              : [
                  {
                    type: 'header',
                    text: strings.ProgramsHeaderText
                  } as IListMenuItem,
                  {
                    text: strings.SelectProgramText,
                    items: programViews
                  } as IListMenuItem,
                  {
                    type: 'divider'
                  } as IListMenuItem
                ]),
            userCanManageViews &&
              ({
                text: strings.NewViewText,
                onClick: () => {
                  context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: true }))
                }
              } as IListMenuItem),
            userCanManageViews &&
              ({
                text: strings.EditViewText,
                disabled: context.state.currentView?.isProgramView,
                onClick: () => {
                  context.dispatch(
                    SET_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView })
                  )
                }
              } as IListMenuItem)
          ]
        } as IListMenuItem,
        {
          icon: Icons.Filter,
          onClick: () => {
            context.dispatch(TOGGLE_FILTER_PANEL())
          }
        } as IListMenuItem
      ].filter(Boolean),
    [context.state, context.props]
  )

  return menuItems
}
