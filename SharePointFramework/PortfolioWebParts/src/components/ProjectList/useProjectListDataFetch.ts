import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'
import {
  convertConfigsToVerticals,
  findDefaultVertical
} from './ProjectListFilterRegistry'

/**
 * Component data fetch hook for `ProjectList`. This hook is responsible for
 * fetching data and setting state. It fetches enriched projects using
 * `dataAdapter.fetchEnrichedProjects()` and checks if the current user is in
 * the `PortfolioInsight` group using `dataAdapter.isUserInGroup()`.
 *
 * Verticals are built from `props.verticalConfigs` (webpart property pane).
 * The selected vertical is determined by the config entry with `isDefault`
 * set to `true`, falling back to the first vertical.
 *
 * @param props Props
 * @param setState Set state callback
 */
export function useProjectListDataFetch(
  props: IProjectListProps,
  setState: (newState: Partial<IProjectListState>) => void
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
      const configs = props.verticalConfigs ?? []
      const verticals = convertConfigsToVerticals(configs)
      const selectedVertical = findDefaultVertical(configs, verticals)

      setState({
        projects,
        isDataLoaded: true,
        isUserInPortfolioManagerGroup,
        verticals,
        selectedVertical
      })
    })
  }, [])
}
