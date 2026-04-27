import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'

/** Fetches enriched projects and group membership for `ProjectList`. */
export function useProjectListDataFetch(
  props: IProjectListProps,
  setState: (
    update:
      | Partial<IProjectListState>
      | ((prev: IProjectListState) => Partial<IProjectListState>)
  ) => void
) {
  useEffect(() => {
    Promise.all([
      props.dataAdapter.fetchEnrichedProjects({
        primaryUserField: props.primaryUserField,
        secondaryUserField: props.secondaryUserField,
        primaryField: props.primaryField,
        secondaryField: props.secondaryField
      }),
      props.dataAdapter.isUserInGroup(resource.Security_SiteGroup_PortfolioInsight_Title)
    ]).then(([projects, isUserInPortfolioManagerGroup]) => {
      setState({
        projects,
        isDataLoaded: true,
        isUserInPortfolioManagerGroup
      })

      // Lazy dead-project verification: only for portfolio admins, since regular
      // users don't see orphaned entries (their verticals filter by
      // isUserMember/hasUserAccess, both false for a deleted site). Candidates
      // are projects the admin has no access to via Graph/Search — those are
      // the only ones that could be "dead vs no-access".
      if (!isUserInPortfolioManagerGroup) return
      const candidates = projects.filter(
        (p) => !p.isUserMember && !p.hasUserAccess && p.url && typeof p.listItemId === 'number'
      )
      if (candidates.length === 0) return
      props.dataAdapter.verifyDeadProjects(candidates).then((deadIds) => {
        if (deadIds.size === 0) return
        setState((prev) => ({
          projects: (prev.projects ?? []).map((p) => {
            if (p.listItemId !== undefined && deadIds.has(p.listItemId)) {
              p.isDead = true
            }
            return p
          })
        }))
      })
    })
  }, [])
}
