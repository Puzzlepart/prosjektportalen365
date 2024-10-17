import { useEffect } from 'react'
import { IIdeaModuleProps, IIdeaModuleState } from './types'

/**
 * Component data fetch hook for `IdeaModule`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param setState Set state callback
 */
export function useIdeaModuleDataFetch(
  props: IIdeaModuleProps,
  refetch: number,
  setState: (newState: Partial<IIdeaModuleState>) => void
) {
  useEffect(() => {
    Promise.all([props.dataAdapter.getConfiguration(props.configurationList)]).then(
      ([configuration]) => {
        setState({
          configuration,
          ideas: configuration,
          loading: false,
          isRefetching: false
        })
      }
    )
  }, [refetch])
}
