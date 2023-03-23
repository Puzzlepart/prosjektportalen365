import { IFooterProps } from './types'

/**
 * Component logic hook for the `Footer` component. Returns the latest entry
 * from the `entries` prop (which is sorted by `InstallStartTime`).
 *
 * @param props Props for the `Footer` component
 */
export function useFooter(props: IFooterProps) {
    const latestEntry = props.installEntries[0]
    let installedVersion = latestEntry.installVersion
    if(latestEntry.installChannel) {
        installedVersion += ` (${latestEntry.installChannel})`
    }
    return { latestEntry, installedVersion } as const
}
