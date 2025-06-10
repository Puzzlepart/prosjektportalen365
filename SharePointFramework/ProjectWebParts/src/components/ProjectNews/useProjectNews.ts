import { useRef } from 'react'
import { IProjectNewsContext } from './context'
import { IProjectNewsProps } from './types'
import { useProjectNewsState } from './useProjectNewsState'
import { useProjectNewsDataFetch } from './useProjectNewsDataFetch'
import { useId } from '@fluentui/react-components'

/**
 * Component logic hook for `ProjectNews`
 */
export function useProjectNews(props: IProjectNewsProps) {
  const rootRef = useRef(null)

  const { state, setState } = useProjectNewsState()
  useProjectNewsDataFetch(props, state.refetch, setState)

  const context: IProjectNewsContext = {
    props,
    state,
    setState
  }

  const fluentProviderId = useId('fp-project-news')

  return { rootRef, context, fluentProviderId } as const
}
