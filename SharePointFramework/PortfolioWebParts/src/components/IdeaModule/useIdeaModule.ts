import { useId } from '@fluentui/react-components'
import { IIdeaModuleProps } from './types'
import { useIdeaModuleState } from './useIdeaModuleState'

/**
 * Component logic hook for `IdeaModule` component.
 *
clear */
export function useIdeaModule(props: IIdeaModuleProps) {
  const { state, setState } = useIdeaModuleState(props)
  const fluentProviderId = useId('fp-idea-module')

  return {
    state,
    setState,
    fluentProviderId
  }
}
