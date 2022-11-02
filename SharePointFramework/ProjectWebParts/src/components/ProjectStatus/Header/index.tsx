import { Shimmer } from '@fluentui/react'
import React, { FC, HTMLProps } from 'react'
import styles from './Header.module.scss'
import { useHeader } from './useHeader'

export const Header: FC<HTMLProps<HTMLDivElement>> = (props) => {
  const { isDataLoaded, title } = useHeader()
  return (
    <Shimmer isDataLoaded={isDataLoaded}>
      <div className={props.className ?? styles.root}>
        <div className={styles.title}>{title}</div>
      </div>
    </Shimmer>
  )
}
