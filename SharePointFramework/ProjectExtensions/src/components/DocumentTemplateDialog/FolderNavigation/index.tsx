/* eslint-disable @typescript-eslint/no-empty-function */
import { Breadcrumb, IBreadcrumbItem } from 'office-ui-fabric-react/lib/Breadcrumb'
import React, { useMemo } from 'react'
import { isEmpty } from 'underscore'
import { createItems } from './createItems'
import styles from './FolderNavigation.module.scss'
import { IFolderNavigationProps } from './types'

export const FolderNavigation = (props: IFolderNavigationProps) => {
  const items = useMemo(() => createItems(props), [props.currentFolder])
  const breadcrumb: IBreadcrumbItem[] = [
    ...props.items || [],
    props.currentFolder !== null && {
      key: 'root',
      text: props.root,
      isCurrentItem: isEmpty(items),
      onClick: () => props.setFolder('')
    },
    ...items
  ].filter(i => i)

  return (
    <div className={styles.root}>
      <Breadcrumb items={breadcrumb} maxDisplayedItems={5} />
    </div>
  )
}
