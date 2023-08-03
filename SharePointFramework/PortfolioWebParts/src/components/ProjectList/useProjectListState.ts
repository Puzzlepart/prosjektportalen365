/* eslint-disable prefer-spread */
import { useState } from 'react'
import _ from 'underscore'
import { ProjectListVerticals } from './ProjectListVerticals'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Component state hook for `ProjectList`.
 *
 * @param props Props
 */
export function useProjectListState(props: IProjectListProps) {
  const defaultSelectedVertical =
    _.find(props.verticals, (vertical) => vertical.key === props.defaultVertical) ??
    _.first(ProjectListVerticals)
  const mockProjects = Array.apply(null, Array(Math.floor(Math.random() * 10) + 10)).map(() => 0)
  const defaultSort = { fieldName: props.sortBy, isSortedDescending: true }
  const [state, $setState] = useState<IProjectListState>({
    searchTerm: '',
    renderMode: props.defaultRenderMode ?? 'tiles',
    selectedVertical: defaultSelectedVertical,
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

  return { state, setState } as const
}
