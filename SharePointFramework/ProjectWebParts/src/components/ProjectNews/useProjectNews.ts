import { IProjectNewsContext } from './context'
import { IProjectNewsProps } from './types'
import { useProjectNewsState } from './useProjectNewsState'
import { useProjectNewsDataFetch } from './useProjectNewsDataFetch'
import { useId, useRestoreFocusTarget } from '@fluentui/react-components'

/**
 * Component logic hook for `ProjectNews`
 */
export const useProjectNews = (props: IProjectNewsProps) => {
  const { state, setState } = useProjectNewsState()
  useProjectNewsDataFetch(props, state.refetch, setState)

  const recentNews = state.data?.news || []

  const context: IProjectNewsContext = {
    props,
    state,
    setState
  }

  const fluentProviderId = useId('fp-project-news')
  // The create button is where the focus goes back to when the dialog closes: the dialog opens
  // from state, with no trigger of Fluent's to return it to (WCAG 2.4.3).
  const restoreFocusTarget: { 'data-tabster'?: string } = useRestoreFocusTarget()

  return {
    context,
    recentNews,
    fluentProviderId,
    restoreFocusTarget
  } as const
}
