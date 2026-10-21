import { IWeb } from '@pnp/sp/webs'
import { ProjectColumn } from 'pp365-shared-library'
import { IStatusColumnProps, ProjectStatusModel } from './types'
import _ from 'lodash'
import { STATUS_REPORT_COLUMN_DEFAULT_PROPS } from './StatusReportColumn'
import resource from 'SharedResources'

/**
 * Fetches data for the `StatusReportColumn` component.
 *
 * @param web Web instance
 * @param column Column instance
 */
export const fetchData = async (web: IWeb, column?: ProjectColumn) => {
  // A fresh object: `_.merge` writes into its first argument, which must not be the defaults.
  const props = _.merge(
    {},
    STATUS_REPORT_COLUMN_DEFAULT_PROPS,
    column.data.dataTypeProperties
  ) as Partial<IStatusColumnProps>
  const [statusReports, statusSections, _columnConfigurations] = await Promise.all([
    web.lists
      .getByTitle(props.statusReportListName)
      .items.top(500)
      .filter(`GtModerationStatus eq '${resource.Choice_GtModerationStatus_Published}'`)
      .orderBy('Created', false)(),
    web.lists
      .getByTitle(props.statusSectionsListName)
      .items.select('GtSecFieldName', 'GtSecIcon')
      .top(10)(),
    web.lists
      .getByTitle(props.columnConfigListName)
      .items.select(
        'GtPortfolioColumnColor',
        'GtPortfolioColumnIconName',
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
    obj[key].icons = obj[key].icons || {}
    obj[key].icons[item.GtPortfolioColumnValue] = item.GtPortfolioColumnIconName
    return obj
  }, {})
  return statusReports.map(
    (item) => new ProjectStatusModel(item, columnConfigurations, statusSections)
  )
}
