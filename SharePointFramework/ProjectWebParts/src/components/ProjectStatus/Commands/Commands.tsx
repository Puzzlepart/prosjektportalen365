import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import { Toolbar } from 'pp365-shared-library'
import { useToolbarItems } from './useToolbarItems'
import styles from '../ProjectStatus.module.scss'
import { Shimmer } from '@fluentui/react/lib/Shimmer'

export const Commands: FC = () => {
  const context = useProjectStatusContext()
  const { menuItems, farMenuItems } = useToolbarItems()
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <div className={styles.commandBar}>
        <div>
          <Toolbar items={menuItems} farItems={farMenuItems} />
        </div>
      </div>
    </Shimmer>
  )
}
