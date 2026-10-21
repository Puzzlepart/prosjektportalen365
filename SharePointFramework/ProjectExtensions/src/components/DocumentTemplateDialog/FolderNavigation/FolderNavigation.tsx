import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import React, { FC, Fragment } from 'react'
import styles from './FolderNavigation.module.scss'
import { IFolderNavigationProps } from './types'
import { useFolderNavigation } from './useFolderNavigation'

/**
 * The trail of folders above the one open, each a step back.
 */
export const FolderNavigation: FC<IFolderNavigationProps> = (props) => {
  const items = useFolderNavigation(props)
  return (
    <div className={styles.root}>
      <Breadcrumb aria-label={strings.FolderNavigationLabel}>
        {items.map((item, index) => (
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

FolderNavigation.displayName = 'FolderNavigation'
