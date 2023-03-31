import { dateAdd, PnPClientStorage } from '@pnp/common'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { IPortfolioOverviewProps } from './types'

/**
 * Hook for using persisted columns in `localStorage`.
 * 
 * @param props Props of `<PortfolioOverview />`
 * @param defaultValue Default value for columns if no persisted value is found
 */
export function usePersistedColumns(props: IPortfolioOverviewProps, defaultValue: ProjectColumn[] = []) {
    const localStore = new PnPClientStorage().local
    const localKey = `portfolio-overview-persisted-columns-${props.pageContext.site.id}`

    /**
     * Sets the columns to persist in `localStorage` using `PnPClientStorage`.
     * 
     * The columns are persisted for 7 days.
     * 
     * @param columns Columns to persist
     */
    const set = (columns: ProjectColumn[]) => {
        new PnPClientStorage().local.put(localKey, columns, dateAdd(new Date(), 'day', 7))
    }

    /**
     * Gets the persisted columns from `localStorage` using `PnPClientStorage`.
     * 
     * @returns The persisted columns or the default value if no persisted value is found
     */
    const get = () => localStore.get(localKey) ?? defaultValue

    return { set, value: get() } as const
}