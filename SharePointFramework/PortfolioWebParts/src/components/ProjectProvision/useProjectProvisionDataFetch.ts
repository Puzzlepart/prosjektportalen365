import { useEffect } from 'react'
import { IProjectProvisionProps, IProjectProvisionState } from './types'
import { Web } from '@pnp/sp/webs'
import { PermissionKind } from '@pnp/sp/security'
import '@pnp/sp/lists'

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

  /**
   * Check if the user has access to the provision site using PnPjs permissions
   *
   * @param provisionUrl The provision URL to check access for
   */
  const checkProvisionSiteAccess = async (provisionUrl: string): Promise<boolean> => {
    try {
      const provisionSite = Web([props.dataAdapter.sp.web, provisionUrl])
      const hasViewPermission = await provisionSite.currentUserHasPermissions(PermissionKind.ViewListItems)
      return hasViewPermission
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    checkProvisionSiteAccess(props.provisionUrl)
      .then((hasAccess) => {
        if (!hasAccess) {
          setState({
            accessDenied: true,
            loading: false,
            isRefetching: false
          })
          return
        }

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
              sensitivityLabels: sensitivityLabels.filter((label) => !label.isLibrary),
              sensitivityLabelsLibrary: sensitivityLabels.filter((label) => label.isLibrary),
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
      })
      .catch(() => {
        setState({
          accessDenied: true,
          loading: false,
          isRefetching: false
        })
      })
  }, [refetch])
}
