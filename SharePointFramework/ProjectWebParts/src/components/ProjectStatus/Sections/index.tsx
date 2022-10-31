import React, { FC, useContext } from 'react'
import { ProjectStatusContext } from '../context'
import styles from './Sections.module.scss'

export const Sections: FC = () => {
  const context = useContext(ProjectStatusContext)
  return <div className={styles.root}>{context.props.isSiteAdmin}</div>
}
