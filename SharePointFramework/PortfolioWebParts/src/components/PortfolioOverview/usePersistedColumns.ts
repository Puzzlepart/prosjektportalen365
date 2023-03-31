import { dateAdd, PnPClientStorage } from '@pnp/common'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { IPortfolioOverviewProps } from './types'
import _ from 'underscore'

/**
 * Hook for using persisted columns in `localStorage`. Only the
 * properties specified in `properties` are persisted to `localStorage` to ensure
 * that the persisted value is not too large for the browser.
 *
 * @param props Props of `<PortfolioOverview />`
 * @param useViewId If `true` the persisted columns are stored per view
 * @param defaultValue Default value for columns if no persisted value is found
 * @param properties Properties to persist (default: `['fieldName', 'key', 'name', 'minWidth', 'sortOrder']`)
 *
 * @returns `[columns, set]` tuple where `columns` is the persisted columns and `set` is a function
 */
export function usePersistedColumns(
  props: IPortfolioOverviewProps,
  defaultValue: ProjectColumn[] = [],
  properties: any[] = ['fieldName', 'key', 'name', 'minWidth', 'sortOrder'],
  localKeyPrefix = 'portfolio-overview-persisted-columns'
) {
  const localStore = new PnPClientStorage().local
  const localKey = `${localKeyPrefix}-${props.pageContext.site.id
    .toString()
    .replace(/-/g, '')}`

  /**
   * Sets the columns to persist in `localStorage` using `PnPClientStorage`.
   *
   * The columns are persisted for 7 days.
   *
   * @param columns Columns to persist
   */
  const set = (columns: ProjectColumn[]) => {
    try {
      const value = columns.map((c) => _.pick(c, ...properties))
      localStore.put(localKey, value, dateAdd(new Date(), 'day', 7))
    } catch { }
  }

  /**
   * Gets the persisted columns from `localStorage` using `PnPClientStorage`,
   * or the default value if no persisted value is found.
   *
   * @returns The persisted columns or the default value if no persisted value is found
   */
  const get = () => localStore.get(localKey) ?? defaultValue

  return [get(), set] as const
}
