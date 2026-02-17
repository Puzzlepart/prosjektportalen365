import { useState, useMemo, useEffect } from 'react'
import { useId } from '@fluentui/react-components'
import { useProjectInformationContext } from '../context'
import { IChildProjectsListState } from './types'

// Show toggle for collapse/expand if child projects >= this value
const COLLAPSE_THRESHOLD = 3
// Number of child projects to show while collapsed.
const ROW_LIMIT = 2

/**
 * Custom React hook for managing children projects state and collapse logic.
 *
 * @returns An object containing the children projects state, toggle function, and other utilities.
 */
export function useChildProjectsList() {
  const context = useProjectInformationContext()
  const childProjects = context.state?.data?.childProjects || []

  const [state, setState] = useState<IChildProjectsListState>({
    viewAll: false,
    projects: childProjects,
    shouldShowToggle: childProjects.length >= COLLAPSE_THRESHOLD
  })

  /**
   * The projects to display based on the current view state
   */
  const displayedProjects = useMemo(() => {
    return state.viewAll ? childProjects : childProjects.slice(0, ROW_LIMIT)
  }, [childProjects, state.viewAll])

  /**
   * Function to toggle the viewAll state
   */
  const toggleViewAll = () => {
    setState(prev => ({
      ...prev,
      viewAll: !prev.viewAll
    }))
  }

  /**
   * Update state when childProjects data changes
   */
  useEffect(() => {
    setState(prev => ({
      ...prev,
      projects: childProjects,
      shouldShowToggle: childProjects.length >= COLLAPSE_THRESHOLD
    }))
  }, [childProjects])

  const fluentProviderId = useId('fp-children-projects-list')

  return {
    ...state,
    displayedProjects,
    toggleViewAll,
    fluentProviderId,
    isEmpty: childProjects.length === 0
  }
}
