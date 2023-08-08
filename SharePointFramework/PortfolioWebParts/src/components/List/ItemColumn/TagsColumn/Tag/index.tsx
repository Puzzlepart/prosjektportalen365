import React from 'react'
import styles from './Tag.module.scss'
import { ITagProps } from './types'

export const Tag = ({ text }: ITagProps) => {
  return <span className={styles.root}>{text}</span>
}
