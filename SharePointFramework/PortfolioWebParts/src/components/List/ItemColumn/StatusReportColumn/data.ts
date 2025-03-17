import { IWeb } from '@pnp/sp/webs'
import { ProjectColumn } from 'pp365-shared-library'
import { IStatusColumnProps, ProjectStatusModel } from './types'
import _ from 'lodash'
import { StatusReportColumn } from './StatusReportColumn'

/**
 * Fetches data for the `StatusReportColumn` component.
 *
 * @param web Web instance
 * @param column Column instance
 */
export const fetchData = async (web: IWeb, column?: ProjectColumn) => {
  const props = _.merge(
    StatusReportColumn.defaultProps,
    column.data.dataTypeProperties
  ) as Partial<IStatusColumnProps>
  const [statusReports, statusSections, _columnConfigurations] = await Promise.all([
    web.lists
      .getByTitle(props.statusReportListName)
      .items.top(500)
      .filter("GtModerationStatus eq 'Publisert'")(),
    web.lists
      .getByTitle(props.statusSectionsListName)
      .items.select('GtSecFieldName', 'GtSecIcon')
      .top(10)(),
    web.lists
      .getByTitle(props.columnConfigListName)
      .items.select(
        'GtPortfolioColumnColor',
        'GtPortfolioColumnValue',
        'GtPortfolioColumn/Title',
        'GtPortfolioColumn/GtInternalName'
      )
      .expand('GtPortfolioColumn')
      .filter(
        "startswith(GtPortfolioColumn/GtInternalName,'GtStatus') or startswith(GtPortfolioColumn/GtInternalName,'GtOverallStatus')"
      )
      .top(500)()
  ])
  const columnConfigurations = _columnConfigurations.reduce((obj, item) => {
    const key = item.GtPortfolioColumn.GtInternalName
    obj[key] = obj[key] || {}
    obj[key].name = obj[key].name || item.GtPortfolioColumn.Title
    obj[key].colors = obj[key].colors || {}
    obj[key].colors[item.GtPortfolioColumnValue] = item.GtPortfolioColumnColor
    return obj
  }, {})
  return statusReports.map(
    (item) => new ProjectStatusModel(item, columnConfigurations, statusSections)
  )
}
