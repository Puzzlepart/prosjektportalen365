import { partitionBreadcrumbItems } from '@fluentui/react-components'
import { useMemo } from 'react'
import { isEmpty } from 'underscore'
import { createItems } from './createItems'
import { IFolderNavigationItem, IFolderNavigationProps } from './types'

/** Matches the `maxDisplayedItems` the v8 Breadcrumb was given. */
const MAX_DISPLAYED_ITEMS = 5

/**
 * Component logic hook for `FolderNavigation`: the trail of the entries given, the root (left
 * out while no folder is open) and the folder's path, cut to what the breadcrumb shows.
 *
 * @param props The navigation's props
 */
export function useFolderNavigation(props: IFolderNavigationProps): IFolderNavigationItem[] {
  const items = useMemo(() => createItems(props), [props.currentFolder])
  const root: IFolderNavigationItem[] =
    props.currentFolder !== undefined
      ? [
          {
            key: 'root',
            text: props.root,
            isCurrentItem: isEmpty(items),
            onClick: () => props.setFolder('')
          }
        ]
      : []
  const trail = [...(props.items ?? []), ...root, ...items]

  // v9 has no `maxDisplayedItems`; `partitionBreadcrumbItems` is its equivalent,
  // splitting the trail into the first item, an overflow bucket and the last few.
  const { startDisplayedItems, overflowItems, endDisplayedItems } = partitionBreadcrumbItems({
    items: trail,
    maxDisplayedItems: MAX_DISPLAYED_ITEMS
  })
  return [...startDisplayedItems, ...(overflowItems ?? []), ...(endDisplayedItems ?? [])]
}
