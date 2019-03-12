import * as React from 'react';
import styles from './StatusPropertySection.module.scss';
import { IStatusPropertySectionProps } from './IStatusPropertySectionProps';
import { IStatusPropertySectionState } from './IStatusPropertySectionState';
import StatusSectionBase from '../StatusSectionBase';
import StatusElement from '../StatusElement';

export default class StatusPropertySection extends StatusSectionBase<IStatusPropertySectionProps, IStatusPropertySectionState> {
    constructor(props: IStatusPropertySectionProps) {
        super(props);
    }

    public render(): React.ReactElement<IStatusPropertySectionProps> {
        const data = this.props.report.item;

        return (
            <div className={styles.statusPropertySection}>
                <div className={styles.container}>
                    <div className={styles.row}>
                        <div className={`${styles.statusPropertySectionHeader} ${styles.column12}`}>
                            <StatusElement {...this.props.headerProps} iconColumnWidth='column1' bodyColumnWidth='column11' />
                        </div>
                        <div className={`${styles.statusPropertySectionFields} ${styles.column12}`}>
                            {super.renderFields()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
