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
      props.dataAdapter.getTeamTemplates(props.provisionUrl),
      props.dataAdapter.getSensitivityLabels(props.provisionUrl),
      props.dataAdapter.getRetentionLabels(props.provisionUrl),
      props.dataAdapter.fetchProvisionRequests(props.pageContext.user.email, props.provisionUrl)
    ])
      .then(([settings, types, teamTemplates, sensitivityLabels, retentionLabels, requests]) => {
        setState({
          settings,
          types: types.filter(
            (type) =>
              !type.visibleTo ||
              type.visibleTo?.some((user) =>
                user?.EMail?.includes(props?.pageContext?.user?.loginName)
              )
          ),
          teamTemplates,
          sensitivityLabels,
          retentionLabels,
          requests,
          loading: false,
          isRefetching: false
        })
      })
      .catch((error) => {
        setState({
          error,
          loading: false,
          isRefetching: false
        })
      })
  }, [refetch])
}
