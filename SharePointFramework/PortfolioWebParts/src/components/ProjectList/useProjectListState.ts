import { useState } from 'react'
import { IProjectListProps, IProjectListState } from './types'
import { convertConfigsToVerticals, findDefaultVertical } from './ProjectListFilterRegistry'

/** State hook for `ProjectList`. Computes verticals synchronously from `props.verticalConfigs`. */
export function useProjectListState(props: IProjectListProps) {
  const defaultSort = { fieldName: props.sortBy.toLocaleLowerCase(), isSortedDescending: true }
  const configs = props.verticalConfigs ?? []
  const verticals = convertConfigsToVerticals(configs)
  const selectedVertical = findDefaultVertical(configs, verticals)
  const [state, $setState] = useState<IProjectListState>({
    searchTerm: '',
    renderMode: props.defaultRenderMode ?? 'tiles',
    projects: [],
    sort: defaultSort,
    verticals,
    selectedVertical
  })

  const setState = (newState: Partial<IProjectListState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState }
}
