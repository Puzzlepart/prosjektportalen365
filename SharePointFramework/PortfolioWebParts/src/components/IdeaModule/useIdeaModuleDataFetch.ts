import { useEffect } from 'react'
import { IIdeaModuleProps, IIdeaModuleState } from './types'

/**
 * Load idea configuration and workflow data when the refetch timestamp changes.
 *
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 */
export function useIdeaModuleDataFetch(
  props: IIdeaModuleProps,
  refetch: number,
  setState: (newState: Partial<IIdeaModuleState>) => void
) {
  useEffect(() => {
    void Promise.all([
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
