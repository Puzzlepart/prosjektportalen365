import { partitionBreadcrumbItems } from '@fluentui/react-components'
import { useMemo } from 'react'
import { isEmpty } from 'underscore'
import { createItems } from './createItems'
import { IFolderNavigationItem, IFolderNavigationProps } from './types'

const MAX_DISPLAYED_ITEMS = 5

/** Builds the folder trail, omitting the library root while the library list is shown. */
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

  const { startDisplayedItems, overflowItems, endDisplayedItems } = partitionBreadcrumbItems({
    items: trail,
    maxDisplayedItems: MAX_DISPLAYED_ITEMS
  })
  return [...startDisplayedItems, ...(overflowItems ?? []), ...(endDisplayedItems ?? [])]
}
