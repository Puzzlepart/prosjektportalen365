import { IProjectNewsContext } from './context'
import { IProjectNewsProps } from './types'
import { useProjectNewsState } from './useProjectNewsState'
import { useProjectNewsDataFetch } from './useProjectNewsDataFetch'
import { useId } from '@fluentui/react-components'

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

  return {
    context,
    recentNews,
    fluentProviderId
  } as const
}
