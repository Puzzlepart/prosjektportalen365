import resource from 'SharedResources'
import { useEffect } from 'react'
import { IProjectListProps, IProjectListState } from './types'
import {
  convertDataSourcesToVerticals,
  findDefaultVertical
} from './ProjectListFilterRegistry'

/**
 * Component data fetch hook for `ProjectList`. This hook is responsible for
 * fetching data and setting state. It fetches enriched projects using
 * `dataAdapter.fetchEnrichedProjects()`, checks if the current user is in
 * the `PortfolioInsight` group using `dataAdapter.isUserInGroup()`, and
 * fetches DataSource items to build dynamic verticals.
 *
 * The selected vertical is determined by:
 * 1. The `defaultVertical` prop (matched against `dataSourceId`)
 * 2. The DataSource with `isDefault === true`
 * 3. The first vertical (lowest `sortOrder`)
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
      props.dataAdapter.isUserInGroup(resource.Security_SiteGroup_PortfolioInsight_Title),
      props.dataAdapter.fetchDataSources(
        resource.Lists_DataSources_Category_Projects,
        resource.Lists_DataSources_Level_Portfolio
      )
    ]).then(([projects, isUserInPortfolioManagerGroup, dataSources]) => {
      const verticals = convertDataSourcesToVerticals(dataSources)
      const selectedVertical = findDefaultVertical(
        dataSources,
        verticals,
        props.defaultVertical
      )

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
