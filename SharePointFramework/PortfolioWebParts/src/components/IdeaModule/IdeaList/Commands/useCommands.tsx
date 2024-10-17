import { format } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ListMenuItem, getFluentIcon } from 'pp365-shared-library'
import { useMemo } from 'react'
import { renderModes } from './renderModes'
import { useIdeaModuleContext } from 'components/IdeaModule/context'
import { IdeaListRenderMode } from 'components/IdeaModule/types'

/**
 * Component logic hook for `Commands`. This hook is responsible for
 * rendering the toolbar and handling its actions.
 */
export function useCommands() {
  const context = useIdeaModuleContext()
  const selectedRenderMode = useMemo(
    () => renderModes.find((renderMode) => renderMode.value === context.state.renderMode),
    [context.state.renderMode]
  )
  const showSortBy = useMemo(
    () => context.props.showSortBy && context.state.renderMode === 'tiles',
    [context.props.showSortBy, context.state.renderMode]
  )

  const toolbarItems = [
    new ListMenuItem(selectedRenderMode?.text, null)
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
                renderMode: value as IdeaListRenderMode
              })
            })
        ),
        { renderMode: [context.state.renderMode] }
      ),
    new ListMenuItem(null, format(strings.SortCardsByLabel, context.props.sortBy))
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
    !context.state.loading || _.isEmpty(context.state.ideas)
      ? ''
      : format(strings.SearchBoxPlaceholderText, context.state.ideas.length)

  return { toolbarItems, searchBoxPlaceholder }
}
