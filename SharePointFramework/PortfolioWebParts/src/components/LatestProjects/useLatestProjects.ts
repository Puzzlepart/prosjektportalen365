import { useEffect, useState } from 'react'
import { SortDirection } from '@pnp/sp/search'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { ILatestProjectsProps, ILatestProjectsState } from './types'
import styles from './LatestProjects.module.scss'
import { useId } from '@fluentui/react-components'

/**
 * Fetch newest-first project sites and manage the expanded list and logo styling. A fetch that
 * fails is counted for usage statistics, once, by its error code, and each press of «view more»
 * or «view less» as a toggle.
 */
export function useLatestProjects(props: ILatestProjectsProps) {
  const [state, setState] = useState<ILatestProjectsState>({
    projects: [],
    loading: true,
    viewAll: false
  })
  const telemetry = useTelemetry()

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
      .catch((error) => {
        telemetry.trackError(error)
        setState({
          ...state,
          projects: [],
          loading: false
        })
      })
  }, [])

  const className = [styles.projectItem, props.showProjectLogo ? styles.withLogo : ''].join(' ')

  const fluentProviderId = useId('fp-latest-projects')

  /**
   * Shows all the projects, or folds them back to the row limit.
   */
  const toggleViewAll = () => {
    setState({ ...state, viewAll: !state.viewAll })
    telemetry.track('viewAll.toggled')
  }

  return {
    ...state,
    className,
    toggleViewAll,
    fluentProviderId
  }
}
