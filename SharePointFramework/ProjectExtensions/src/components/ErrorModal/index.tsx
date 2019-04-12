import * as React from 'react';
import styles from './ErrorModal.module.scss';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IErrorModalProps } from './IErrorModalProps';

export default class ErrorModal extends React.PureComponent<IErrorModalProps, { isOpen?: boolean }> {
    public constructor(props: IErrorModalProps) {
        super(props);
        this.state = { isOpen: true };
    }

    public render(): React.ReactElement<IErrorModalProps> {
        return (
            <Modal
                isOpen={this.state.isOpen}
                onDismiss={this.onDismiss}
                isBlocking={false}
                isDarkOverlay={true}>
                <div className={styles.errorModal}>
                    <div className={styles.errorModalBody}>
                        <div className={styles.modalTitle}>{this.props.error.message}</div>
                        <MessageBar messageBarType={MessageBarType.error}>{this.props.error.stack}</MessageBar>
                    </div>
                    <div className={styles.setupVersion}>{this.props.version}</div>
                </div>
            </Modal>
        );
    }

    @autobind
    protected onDismiss() {
        this.setState((prevState) => ({ isOpen: !prevState.isOpen }));
    }
}

export { IErrorModalProps };