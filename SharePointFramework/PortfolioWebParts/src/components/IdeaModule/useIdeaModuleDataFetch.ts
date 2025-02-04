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
    Promise.all([
      props.dataAdapter.getIdeaConfiguration(props.ideaConfigurationList, props.ideaConfiguration)
    ]).then(async ([configuration]) => {
      await props.dataAdapter.getIdeasData(configuration).then((ideas) =>
        setState({
          configuration,
          ideas,
          loading: false,
          isRefetching: false
        })
      )
    })
  }, [refetch])
}
