import * as React from 'react';
import styles from './StatusSectionBase.module.scss';
import { IStatusSectionBaseProps } from './IStatusSectionBaseProps';
import { IStatusSectionBaseState } from './IStatusSectionBaseState';

export default class StatusSectionBase<T1 extends IStatusSectionBaseProps, T2 extends IStatusSectionBaseState> extends React.Component<T1, T2> {
    constructor(props: T1) {
        super(props);
    }

    /**
     * Renders the <StatusSectionBase /> component
     */
    public render(): React.ReactElement<T1> {
        return (
            <div className={styles.statusSection}>
                <div className={styles.container}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}
