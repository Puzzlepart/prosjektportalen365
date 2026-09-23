import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  partitionBreadcrumbItems
} from '@fluentui/react-components'
import React, { Fragment, useMemo } from 'react'
import { isEmpty } from 'underscore'
import { createItems } from './createItems'
import styles from './FolderNavigation.module.scss'
import { IFolderNavigationItem, IFolderNavigationProps } from './types'

/** Matches the `maxDisplayedItems` the v8 Breadcrumb was given. */
const MAX_DISPLAYED_ITEMS = 5

export const FolderNavigation = (props: IFolderNavigationProps) => {
  const items = useMemo(() => createItems(props), [props.currentFolder])
  const breadcrumb: IFolderNavigationItem[] = [
    ...(props.items || []),
    props.currentFolder !== null && {
      key: 'root',
      text: props.root,
      isCurrentItem: isEmpty(items),
      onClick: () => props.setFolder('')
    },
    ...items
  ].filter((i) => i) as IFolderNavigationItem[]

  // v9 has no `maxDisplayedItems`; `partitionBreadcrumbItems` is its equivalent,
  // splitting the trail into the first item, an overflow bucket and the last few.
  const { startDisplayedItems, overflowItems, endDisplayedItems } = partitionBreadcrumbItems({
    items: breadcrumb,
    maxDisplayedItems: MAX_DISPLAYED_ITEMS
  })
  const displayed = [...startDisplayedItems, ...(overflowItems ?? []), ...(endDisplayedItems ?? [])]

  return (
    <div className={styles.root}>
      <Breadcrumb>
        {displayed.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 && <BreadcrumbDivider />}
            <BreadcrumbItem>
              <BreadcrumbButton current={item.isCurrentItem} onClick={item.onClick}>
                {item.text}
              </BreadcrumbButton>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </Breadcrumb>
    </div>
  )
}
