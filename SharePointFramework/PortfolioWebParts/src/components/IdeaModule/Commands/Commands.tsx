import React, { FC } from 'react'
import { Toolbar } from 'pp365-shared-library'
import { useToolbarItems } from './useToolbarItems'
import styles from './Commands.module.scss'

export const Commands: FC = () => {
  const { menuItems, farMenuItems } = useToolbarItems()

  return (
    <div className={styles.commands}>
      <Toolbar items={menuItems} farItems={farMenuItems} />
    </div>
  )
}
