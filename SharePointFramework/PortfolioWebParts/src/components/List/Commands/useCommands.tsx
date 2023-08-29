import { ContextualMenuItemType, ICommandBarProps, IContextualMenuItem } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models/PortfolioOverviewView'
import { useContext } from 'react'
import { PortfolioOverviewContext } from '../../PortfolioOverview/context'
import {
  CHANGE_VIEW,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL,
  TOGGLE_VIEW_FORM_PANEL
} from '../../PortfolioOverview/reducer'
import { usePortfolioOverviewFilters } from '../../PortfolioOverview/usePortfolioOverviewFilters'
import { useConvertViewsToContextualMenuItems } from './useConvertViewsToContextualMenuItems'
import { useExcelExport } from './useExcelExport'

/**
 * Component logic hook for the PortfolioOverviewCommands component. Handles the logic for
 * the command bar and the filter panel.
 *
 * Renders the following context menu items for the command bar:
 * - `EXCEL_EXPORT`: Excel export button
 * - `NEW_VIEW`: New view button
 * - `VIEW_OPTIONS`: View options button
 * - `FILTERS`: Filters button
 */
export function useCommands() {
  const context = useContext(PortfolioOverviewContext)
  const filters = usePortfolioOverviewFilters()
  const convertViewsToContextualMenuItems = useConvertViewsToContextualMenuItems()
  const { exportToExcelContextualMenuItem } = useExcelExport()

  const sharedViews = convertViewsToContextualMenuItems((v) => !v.isPersonal)
  const personalViews = convertViewsToContextualMenuItems((v) => v.isPersonal)
  const userCanManageViews =
    !context.props.isParentProject && context.props.configuration.userCanAddViews

  const items = [exportToExcelContextualMenuItem]
  const farItems: IContextualMenuItem[] = []
  const viewOptionsItem: IContextualMenuItem = {
    key: 'VIEW_OPTIONS',
    name: context.state.currentView?.title,
    iconProps: { iconName: 'List' },
    buttonStyles: { root: { border: 'none' } },
    itemType: ContextualMenuItemType.Header,
    data: { isVisible: context.props.showViewSelector },
    subMenuProps: {
      styles: {
        root: {
          minWidth: 300
        }
      },
      items: [
        {
          key: 'VIEW_LIST',
          name: strings.ListViewText,
          iconProps: { iconName: 'List' },
          canCheck: true,
          checked: !context.state.isCompact,
          onClick: () => {
            context.dispatch(TOGGLE_COMPACT())
          }
        },
        {
          key: 'VIEW_COMPACT',
          name: strings.CompactViewText,
          iconProps: { iconName: 'AlignLeft' },
          canCheck: true,
          checked: context.state.isCompact,
          onClick: () => {
            context.dispatch(TOGGLE_COMPACT())
          }
        },
        {
          key: 'VIEWS_DIVIDER',
          itemType: ContextualMenuItemType.Divider
        },
        ...sharedViews
      ]
    }
  }
  if (!_.isEmpty(personalViews)) {
    viewOptionsItem.subMenuProps.items.push({
      key: 'PERSONAL_VIEWS_HEADER',
      itemType: ContextualMenuItemType.Header,
      text: strings.PersonalViewsHeaderText
    })
    viewOptionsItem.subMenuProps.items.push(...personalViews)
  }
  if (context.props.showProgramViews && !_.isEmpty(context.props.configuration.programs)) {
    viewOptionsItem.subMenuProps.items.push({
      key: 'PROGRAMS_HEADER',
      itemType: ContextualMenuItemType.Header,
      text: strings.ProgramsHeaderText
    })
    const selectProgramItem: IContextualMenuItem = {
      key: 'SELECT_PROGRAM',
      name: strings.SelectProgramText,
      subMenuProps: {
        items: context.props.configuration.programs.map(
          (p) =>
            ({
              key: p.id,
              text: p.name,
              canCheck: true,
              checked: context.state.currentView?.id === p.id,
              onClick: () => {
                const defaultView = context.props.configuration.views.find((v) => v.isDefaultView)
                if (!defaultView) return
                const view = new PortfolioOverviewView().configureFrom(defaultView).set({
                  id: p.id,
                  title: p.name
                })
                view.searchQueries = p.buildQueries(defaultView.searchQuery)
                context.dispatch(CHANGE_VIEW(view))
              }
            } as IContextualMenuItem)
        )
      }
    }
    viewOptionsItem.subMenuProps.items.push(selectProgramItem)
  }
  if (userCanManageViews) {
    viewOptionsItem.subMenuProps.items.push({
      key: 'VIEW_ACTIONS_DIVIDER',
      itemType: ContextualMenuItemType.Divider
    })
    viewOptionsItem.subMenuProps.items.push({
      key: 'NEW_VIEW',
      name: strings.NewViewText,
      onClick: () => {
        context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: true }))
      }
    })
    viewOptionsItem.subMenuProps.items.push({
      key: 'EDIT_VIEW',
      name: strings.EditViewText,
      disabled: context.state.currentView?.isProgramView,
      onClick: () => {
        context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: true, view: context.state.currentView }))
      }
    })
  }
  farItems.push(viewOptionsItem)
  farItems.push({
    key: 'FILTERS',
    iconProps: { iconName: 'Filter' },
    buttonStyles: { root: { border: 'none' } },
    canCheck: true,
    checked: context.state.isFilterPanelOpen,
    data: { isVisible: context.props.showFilters },
    onClick: (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      context.dispatch(TOGGLE_FILTER_PANEL())
    }
  })

  const commandItemsDisabled =
    context.state.loading || !!context.state.error || !!context.state.isChangingView

  const commandBarProps: ICommandBarProps = {
    items: []
  }
  commandBarProps.items = items
    .filter((i) => i.data?.isVisible !== false)
    .map((i) => ({
      ...i,
      disabled: i.disabled || commandItemsDisabled
    }))
  commandBarProps.farItems = farItems
    .filter((i) => i.data?.isVisible !== false)
    .map((i) => ({
      ...i,
      disabled: i.disabled || commandItemsDisabled
    }))

  return {
    commandBarProps,
    filters
  } as const
}
