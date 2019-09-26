import * as React from 'react';
import styles from './BaseSection.module.scss';
import { IBaseSectionProps } from './IBaseSectionProps';
import { IBaseSectionState } from './IBaseSectionState';

export class BaseSection<T1 extends IBaseSectionProps, T2 extends IBaseSectionState> extends React.Component<T1, T2> {
    constructor(props: T1) {
        super(props);
    }

    /**
     * Renders the <BaseSection /> component
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

export { IBaseSectionProps, IBaseSectionState };