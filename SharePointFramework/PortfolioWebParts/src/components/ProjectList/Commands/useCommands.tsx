import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ListMenuItem, ProjectColumn, getFluentIcon, format } from 'pp365-shared-library'
import { useContext, useMemo } from 'react'
import { ProjectListContext } from '../context'
import { ProjectListRenderMode } from '../types'
import { renderModes } from './renderModes'

/**
 * The name the sort button gives the field the cards are sorted by: the title by the name the list
 * view gives it («Tittel»), another field by its project column's. It gave the internal name,
 * «Sorter flisene etter: Title», since 1.9.0.
 *
 * @param sortBy The field the cards are sorted by
 * @param projectColumns The hub's project columns
 */
function getSortFieldName(sortBy: string, projectColumns?: ProjectColumn[]): string {
  if (sortBy?.toLowerCase() === 'title') return strings.TitleLabel
  return _.find(projectColumns, (column) => column.internalName === sortBy)?.name || sortBy
}

/**
 * Component logic hook for `Commands`. This hook is responsible for
 * rendering the toolbar and handling its actions.
 */
export function useCommands() {
  const context = useContext(ProjectListContext)
  const selectedRenderMode = useMemo(
    () => renderModes.find((renderMode) => renderMode.value === context.state.renderMode),
    [context.state.renderMode]
  )
  const showSortBy = useMemo(
    () => context.props.showSortBy && context.state.renderMode === 'tiles',
    [context.props.showSortBy, context.state.renderMode]
  )
  const sortFieldName = getSortFieldName(context.props.sortBy, context.props.projectColumns)

  const toolbarItems = [
    new ListMenuItem(selectedRenderMode?.text, strings.RenderModeLabel)
      // Named by what it does as well as the mode it shows: «Kort, visningsmodus».
      .setAriaLabel(format(strings.RenderModeButtonLabel, selectedRenderMode?.text))
      .setHidden(!context.props.showRenderModeSelector)
      .setIcon(selectedRenderMode?.icon)
      .setWidth('fit-content')
      .setStyle({ minWidth: '145px' })
      .setItems(
        renderModes.map(({ value, text, icon }) =>
          new ListMenuItem(text, null)
            .setIcon(icon)
            .makeCheckable({
              name: 'renderMode',
              value
            })
            .setOnClick(() => {
              context.setState({
                renderMode: value as ProjectListRenderMode
              })
            })
        ),
        { renderMode: [context.state.renderMode] }
      ),
    new ListMenuItem(null, format(strings.SortCardsByLabel, sortFieldName))
      .setHidden(!showSortBy)
      .setIcon(
        context.state.sort?.isSortedDescending
          ? getFluentIcon('TextSortAscending', { jsx: false })
          : getFluentIcon('TextSortDescending', { jsx: false })
      )
      .setOnClick(() => {
        context.setState({
          sort: {
            fieldName: context.state.sort?.fieldName ?? context.props.sortBy,
            isSortedDescending: !context.state.sort?.isSortedDescending
          }
        })
      })
  ]

  const searchBoxPlaceholder =
    !context.state.isDataLoaded || _.isEmpty(context.state.projects)
      ? ''
      : format(context.state.selectedVertical.searchBoxPlaceholder, context.projects.length)

  return { toolbarItems, searchBoxPlaceholder }
}
