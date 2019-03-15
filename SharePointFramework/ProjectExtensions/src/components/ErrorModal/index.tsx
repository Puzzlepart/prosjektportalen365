import * as React from 'react';
import styles from './ErrorModal.module.scss';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { IErrorModalProps } from './IErrorModalProps';

export default class ErrorModal extends React.Component<IErrorModalProps, {}> {
    public render(): React.ReactElement<IErrorModalProps> {
        return (
            <Modal
                isOpen={true}
                onDismiss={this.props.onDismiss}
                isBlocking={this.props.isBlocking}
                isDarkOverlay={this.props.isDarkOverlay}>
                <div className={styles.errorModal}>
                    <div className={styles.errorModalBody}>
                        <div className={styles.modalTitle}>{strings.ErrorModalTitle}</div>
                        <MessageBar messageBarType={MessageBarType.error}>{this.props.errorText}</MessageBar>
                    </div>
                </div>
            </Modal>
        );
    }
}

export { IErrorModalProps };