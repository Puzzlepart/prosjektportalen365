/* eslint-disable prefer-spread */
import { useState } from 'react'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Component state hook for `ProjectList`. Verticals and selected vertical
 * are initially `undefined` and populated asynchronously by `useProjectListDataFetch`
 * after DataSources have been loaded.
 *
 * @param props Props
 */
export function useProjectListState(props: IProjectListProps) {
  const mockProjects = Array.apply(null, Array(Math.floor(Math.random() * 10) + 10)).map(() => 0)
  const defaultSort = { fieldName: props.sortBy, isSortedDescending: true }
  const [state, $setState] = useState<IProjectListState>({
    searchTerm: '',
    renderMode: props.defaultRenderMode ?? 'tiles',
    projects: mockProjects,
    sort: defaultSort
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
