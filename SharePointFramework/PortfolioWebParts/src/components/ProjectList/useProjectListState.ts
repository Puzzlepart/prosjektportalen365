/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectListProps, IProjectListState } from './types'
import { convertConfigsToVerticals, findDefaultVertical } from './ProjectListFilterRegistry'

/** State hook for `ProjectList`. Computes verticals synchronously from `props.verticalConfigs`. */
export function useProjectListState(props: IProjectListProps) {
  const mockProjects = Array.apply(null, Array(Math.floor(Math.random() * 10) + 10)).map(() => 0)
  const defaultSort = { fieldName: props.sortBy.toLocaleLowerCase(), isSortedDescending: true }
  const configs = props.verticalConfigs ?? []
  const verticals = convertConfigsToVerticals(configs)
  const selectedVertical = findDefaultVertical(configs, verticals)
  const [state, $setState] = useState<IProjectListState>({
    searchTerm: '',
    renderMode: props.defaultRenderMode ?? 'tiles',
    projects: mockProjects,
    sort: defaultSort,
    verticals,
    selectedVertical
  })

  const setState = (newState: Partial<IProjectListState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState }
}
