import { useEffect, useState } from 'react'
import { SortDirection } from '@pnp/sp/search'
import { ILatestProjectsProps, ILatestProjectsState } from './types'
import styles from './LatestProjects.module.scss'
import { useId } from '@fluentui/react-components'

/**
 * Custom React hook for fetching and managing the latest projects.
 *
 * @param props - The props for the LatestProjects component.
 *
 * @returns An object containing the loading state, the latest projects, a boolean indicating whether to view all projects, and a function to toggle the view all state.
 */
export function useLatestProjects(props: ILatestProjectsProps) {
  const [state, setState] = useState<ILatestProjectsState>({
    projects: [],
    loading: true,
    viewAll: false
  })

  useEffect(() => {
    props.dataAdapter
      .fetchProjectSites(props.maxRowLimit, 'Created', SortDirection.Descending)
      .then((projects) => {
        setState({
          ...state,
          projects,
          loading: false
        })
      })
      .catch(() => {
        setState({
          ...state,
          projects: [],
          loading: false
        })
      })
  }, [])

  /**
   * Conditionally add the 'withLogo' class to the project item container if the showProjectLogo prop is true.
   */
  const className = [styles.projectItem, props.showProjectLogo ? styles.withLogo : ''].join(' ')

  const fluentProviderId = useId('fp-latest-projects')

  return {
    ...state,
    className,
    toggleViewAll: () => setState({ ...state, viewAll: !state.viewAll }),
    fluentProviderId
  }
}
