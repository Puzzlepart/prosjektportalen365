import * as React from 'react';
import styles from './ProjectSetupBaseModal.module.scss';
import { Modal } from 'office-ui-fabric-react/lib/Modal';

import { IProjectSetupBaseModalProps } from './IProjectSetupBaseModalProps';
import { IProjectSetupBaseModalState } from './IProjectSetupBaseModalState';

export default class ProjectSetupBaseModal extends React.PureComponent<IProjectSetupBaseModalProps, IProjectSetupBaseModalState> {
    constructor(props: IProjectSetupBaseModalProps) {
        super(props);
        this.state = { isOpen: true };
    }

    public render(): React.ReactElement<IProjectSetupBaseModalProps> {
        return (
            <Modal
                isOpen={this.state.isOpen}
                onDismiss={this._onDismiss.bind(this)}
                isBlocking={this.props.isBlocking}
                isDarkOverlay={this.props.isDarkOverlay}
                containerClassName={`${styles.projectSetupBaseModal} ${this.props.containerClassName}`}>
                <div className={styles.modalInner}>
                    <div className={styles.modalTitle}>
                        {this.props.title}
                    </div>
                    <div className={styles.modalBody}>
                        {this.props.children}
                    </div>
                </div>
                <div className={styles.setupVersionString}>{this.props.versionString}</div>
            </Modal>
        );
    }

    protected _onDismiss() {
        this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
    }
}
