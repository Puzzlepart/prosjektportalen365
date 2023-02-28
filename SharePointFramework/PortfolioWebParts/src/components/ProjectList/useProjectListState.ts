/* eslint-disable prefer-spread */
import { useState } from 'react'
import _ from 'underscore'
import { ProjectListViews } from './ProjectListViews'
import { IProjectListProps, IProjectListState } from './types'

/**
 * Component state hook for `ProjectList`.
 *
 * @param props Props
 */
export function useProjectListState(props: IProjectListProps) {
  const defaultSelectedView =
    _.find(props.views, (view) => view.itemKey === props.defaultView) ?? _.first(ProjectListViews)
  const mockProjects = Array.apply(null, Array(Math.floor(Math.random() * 10) + 10)).map(() => 0)
  const defaultSort = { fieldName: props.sortBy, isSortedDescending: true }
  const [state, $setState] = useState<IProjectListState>({
    searchTerm: '',
    renderAs: 'tiles',
    selectedView: defaultSelectedView,
    projects: mockProjects,
    isUserInPortfolioManagerGroup: false,
    sort: defaultSort
  })

  const setState = (newState: Partial<IProjectListState>) =>
    $setState((state_) => ({ ...state_, ...newState }))

  return { state, setState } as const
}
