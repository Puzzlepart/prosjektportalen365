import resource from 'SharedResources'
import { IStatusColumnProps } from './types'

/**
 * The status report column's defaults: the hub lists it reads, by their names in the site's
 * language, and the details shown while the pointer rests on the strip. `fetchData` reads them too
 * and merges the column's own settings over them. They live apart from the component, so the
 * component and `fetchData` need not import each other.
 */
export const STATUS_REPORT_COLUMN_DEFAULT_PROPS: Partial<IStatusColumnProps> = {
  statusReportListName: resource.Lists_ProjectStatus_Title,
  columnConfigListName: resource.Lists_ProjectColumnConfiguration_Title,
  statusSectionsListName: resource.Lists_StatusSections_Title,
  openOnHover: true
}
