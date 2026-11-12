import _ from 'lodash'
import { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'
import { ProjectContentColumn } from 'pp365-shared-library'
import resource from 'SharedResources'

/**
 * Keep selected or locked columns, omitting project title for project-level and idea views.
 */
export function useDefaultColumns(context: IPortfolioAggregationContext) {
  let selectedColumns: ProjectContentColumn[] = useMemo(
    () => _.filter([...context.state.columns], (c) => c.data?.isSelected || c.data?.isLocked),
    [context.state.columns]
  )

  if (
    context.state.dataSourceLevel === resource.Lists_DataSources_Level_Project ||
    context.state.dataSourceCategory === resource.Lists_DataSources_Category_IdeaModule
  )
    selectedColumns = selectedColumns.filter((c) => c.internalName !== 'SiteTitle')

  return selectedColumns
}
