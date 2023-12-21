import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem } from 'pp365-shared-library'
import { useEffect, useMemo } from 'react'
import { IProjectListProps, IProjectListState, IRenderMode, ProjectListRenderMode } from '../types'
import {
  AppsListFilled,
  AppsListRegular,
  bundleIcon,
  GridFilled,
  GridRegular,
  TextBulletListLtrFilled,
  TextBulletListLtrRegular,
  TextSortAscendingFilled,
  TextSortAscendingRegular,
  TextSortDescendingFilled,
  TextSortDescendingRegular
} from '@fluentui/react-icons'
import { format } from '@fluentui/react'
import { find } from '@microsoft/sp-lodash-subset'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  Grid: bundleIcon(GridFilled, GridRegular),
  AppsList: bundleIcon(AppsListFilled, AppsListRegular),
  TextBulletList: bundleIcon(TextBulletListLtrFilled, TextBulletListLtrRegular),
  TextSortAscending: bundleIcon(TextSortAscendingFilled, TextSortAscendingRegular),
  TextSortDescending: bundleIcon(TextSortDescendingFilled, TextSortDescendingRegular)
}

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The IPortfolioOverviewContext object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(
  state: IProjectListState,
  setState: (newState: Partial<IProjectListState>) => void,
  props: IProjectListProps
) {
  const renderModes: IRenderMode[] = [
    {
      value: 'tiles',
      text: strings.RenderModeTilesText,
      icon: Icons.Grid
    },
    {
      value: 'list',
      text: strings.RenderModeListText,
      icon: Icons.AppsList
    },
    {
      value: 'compactList',
      text: strings.RenderModeCompactListText,
      icon: Icons.TextBulletList
    }
  ]

  useEffect(
    () =>
      setState({
        selectedRenderMode: find(renderModes, (mode) => mode.value === state.renderMode)
      }),
    [state.renderMode]
  )

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(state.selectedRenderMode?.text, null)
          .setIcon(state.selectedRenderMode?.icon)
          .setWidth('fit-content')
          .setStyle({ minWidth: '145px' })
          .setItems(
            renderModes.map((renderMode) =>
              new ListMenuItem(renderMode.text, null)
                .setIcon(renderMode.icon)
                .makeCheckable({
                  name: 'renderMode',
                  value: renderMode.value
                })
                .setOnClick(() => {
                  setState({
                    renderMode: renderMode.value as ProjectListRenderMode,
                    selectedRenderMode: renderMode
                  })
                })
            ),
            { renderMode: [state.renderMode] }
          ),
        props.showSortBy &&
        state.renderMode === 'tiles' &&
        new ListMenuItem(null, format(strings.SortCardsByLabel, props.sortBy))
          .setIcon(
            state.sort?.isSortedDescending ? Icons.TextSortAscending : Icons.TextSortDescending
          )
          .setOnClick(() => {
            setState({
              sort: {
                fieldName: state.sort?.fieldName || props.sortBy,
                isSortedDescending: !state.sort?.isSortedDescending
              }
            })
          })
      ].filter(Boolean),
    [state, props]
  )

  return menuItems
}
