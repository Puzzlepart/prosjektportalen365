import { useState, useMemo, useEffect } from 'react'
import { useId } from '@fluentui/react-components'
import { useProjectInformationContext } from '../context'
import { IChildProjectsListState } from './types'
import { isEmpty } from 'underscore'

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
    shouldShowToggle: childProjects.length >= context.props.minRowLimit
  })

  const projects = useMemo(() => {
    return state.viewAll ? childProjects : childProjects.slice(0, context.props.rowLimit)
  }, [childProjects, state.viewAll])

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      projects: childProjects,
      shouldShowToggle: childProjects.length > context.props.minRowLimit
    }))
  }, [childProjects])

  const fluentProviderId = useId('fp-child-projects-list')

  return {
    ...state,
    projects,
    toggleViewAll: () => setState({ ...state, viewAll: !state.viewAll }),
    fluentProviderId,
    hideChildProjectsList: context.props.hideChildProjects || isEmpty(childProjects)
  }
}
