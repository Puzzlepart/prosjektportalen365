import { useEffect, useState } from 'react'
import { SortDirection } from '@pnp/sp/search'
import { ILatestProjectsProps, ILatestProjectsState } from './types'
import styles from './LatestProjects.module.scss'
import { useId } from '@fluentui/react-components'

/**
 * Fetch newest-first project sites and manage the expanded list and logo styling.
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

  const className = [styles.projectItem, props.showProjectLogo ? styles.withLogo : ''].join(' ')

  const fluentProviderId = useId('fp-latest-projects')

  return {
    ...state,
    className,
    toggleViewAll: () => setState({ ...state, viewAll: !state.viewAll }),
    fluentProviderId
  }
}
