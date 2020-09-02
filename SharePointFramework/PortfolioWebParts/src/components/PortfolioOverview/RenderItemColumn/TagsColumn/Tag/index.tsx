import * as React from 'react'
import styles from './Tag.module.scss'
import { ITagProps } from './ITagProps'

export class Tag extends React.Component<ITagProps, {}> {
    public render(): React.ReactElement<ITagProps> {
        return (
            <span className={styles.tag}>{this.props.text}</span>
        )
    }
}
