import * as React from 'react';
import styles from './StatusSectionBase.module.scss';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IStatusSectionBaseProps } from './IStatusSectionBaseProps';
import { IStatusSectionBaseState } from './IStatusSectionBaseState';

export default class StatusSectionBase<P extends IStatusSectionBaseProps, S extends IStatusSectionBaseState> extends React.Component<P, S> {
    constructor(props: P) {
        super(props);
    }

    /**
     * Renders the <StatusSectionBase /> component
     */
    public render(): React.ReactElement<P> {
        return (
            <div className={styles.statusSection}>
                <div className={`${styles.container} ms-Grid`}>
                    <div className='ms-Grid-row'>
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}
