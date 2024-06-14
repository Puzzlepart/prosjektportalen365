import { useEffect } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'

/**
 * Component data fetch hook for `ProjectProvision`. This hook is responsible for
 * fetching data and setting state.
 *
 * @param props Props
 * @param refetch Timestamp for refetch. Changes to this variable refetches the data in `useEffect`
 * @param setState Set state callback
 */
export function useProjectProvisionDataFetch(
  props: IProjectProvisionProps,
  refetch: number,
  setState: (newState: Partial<IProjectProvisionState>) => void
) {
  useEffect(() => {
    Promise.all([
      props.dataAdapter.getProvisionRequestSettings(props.provisionUrl),
      props.dataAdapter.getProvisionTypes(props.provisionUrl),
      props.dataAdapter.fetchProvisionRequests(props.pageContext.user.email, props.provisionUrl)
    ]).then(([settings, types, requests]) => {
      setState({
        settings,
        types,
        requests,
        loading: false,
        isRefetching: false
      })
    })
  }, [refetch])
}
