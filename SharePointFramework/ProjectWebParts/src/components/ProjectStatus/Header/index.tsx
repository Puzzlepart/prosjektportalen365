import { Shimmer } from '@fluentui/react'
import moment from 'moment'
import React, { FC, useContext } from 'react'
import { ProjectStatusContext } from '../context'
import styles from './Header.module.scss'

export const Header: FC = () => {
  const context = useContext(ProjectStatusContext)
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <div className={styles.root}>
        <div className={styles.title}>
          {context.props.title}{' '}
          {context.state.selectedReport
            ? moment(
                context.state.selectedReport.publishedDate ?? context.state.selectedReport.created
              ).format('DD.MM.yyyy')
            : null}{' '}
        </div>
      </div>
    </Shimmer>
  )
}
