/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectListProps, IProjectListState } from './types'
import {
  convertConfigsToVerticals,
  findDefaultVertical
} from './ProjectListFilterRegistry'

/**
 * Component state hook for `ProjectList`. Verticals and selected vertical
 * are computed synchronously from `props.verticalConfigs` so they are
 * available on the initial render. Async data (projects, group membership)
 * is populated later by `useProjectListDataFetch`.
 *
 * @param props Props
 */
export function useProjectListState(props: IProjectListProps) {
  const mockProjects = Array.apply(null, Array(Math.floor(Math.random() * 10) + 10)).map(() => 0)
  const defaultSort = { fieldName: props.sortBy, isSortedDescending: true }
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

  /**
   * Set state like `setState` in class components where
   * the new state is merged with the current state.
   *
   * @param newState New state
   */
  const setState = (newState: Partial<IProjectListState>) =>
    $setState((currentState) => ({ ...currentState, ...newState }))

  return { state, setState }
}
