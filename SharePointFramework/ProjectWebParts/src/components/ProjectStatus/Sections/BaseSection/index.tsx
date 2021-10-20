import React from 'react'
import styles from './BaseSection.module.scss'
import { IBaseSectionProps, IBaseSectionState } from './types'

export class BaseSection<
  T1 extends IBaseSectionProps,
  T2 extends IBaseSectionState
> extends React.Component<T1, T2> {
  public render(): React.ReactElement<T1> {
    return (
      <div className={styles.statusSection}>
        <div className={styles.container}>{this.props.children}</div>
      </div>
    )
  }
}

export * from './types'
