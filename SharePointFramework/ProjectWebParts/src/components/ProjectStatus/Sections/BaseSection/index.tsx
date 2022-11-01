import { Shimmer } from '@fluentui/react'
import { ProjectStatusContext } from 'components/ProjectStatus/context'
import React, { FC, HTMLProps, useContext } from 'react'
import styles from './BaseSection.module.scss'

export const BaseSection: FC<HTMLProps<HTMLDivElement>> = ({ children }) => {
  const context = useContext(ProjectStatusContext)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <Shimmer isDataLoaded={context.state.isDataLoaded}>{children}</Shimmer>
      </div>
    </div>
  )
}
