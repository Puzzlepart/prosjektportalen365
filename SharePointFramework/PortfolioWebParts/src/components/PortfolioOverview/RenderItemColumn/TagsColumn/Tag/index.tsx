import React, { Component } from 'react'
import styles from './Tag.module.scss'
import { ITagProps } from './ITagProps'

// eslint-disable-next-line @typescript-eslint/ban-types
export class Tag extends Component<ITagProps, {}> {
  public render(): React.ReactElement<ITagProps> {
    return <span className={styles.tag}>{this.props.text}</span>
  }
}
