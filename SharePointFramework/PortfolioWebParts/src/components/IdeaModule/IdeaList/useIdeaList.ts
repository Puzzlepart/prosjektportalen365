/* eslint-disable prefer-spread */
import { useId } from '@fluentui/react-components'
import { IIdeaListProps } from './types'
import { useIdeaModuleContext } from '../context'

/**
 * Component logic hook for `IdeaList`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 *
 * @param props Props
 */
export const useIdeaList = (props: IIdeaListProps) => {
  const context = useIdeaModuleContext()
  const fluentProviderId = useId('fp-idea-list')

  return {
    context,
    props,
    fluentProviderId
  }
}
