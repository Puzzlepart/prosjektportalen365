import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import { LoadingSkeleton, Toolbar } from 'pp365-shared-library'
import { useToolbarItems } from './useToolbarItems'
import styles from '../ProjectStatus.module.scss'

export const Commands: FC = () => {
  const context = useProjectStatusContext()
  const { menuItems, farMenuItems } = useToolbarItems()

  // A single skeleton row: this stands in for one toolbar, where the default
  // three-row placeholder would take far more space than the real content.
  if (!context.state.isDataLoaded) return <LoadingSkeleton rows={['medium']} />

  return (
    <div className={styles.commandBar}>
      <div>
        <Toolbar items={menuItems} farItems={farMenuItems} />
      </div>
    </div>
  )
}
