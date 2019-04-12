import * as React from 'react';
import styles from './ProgressModal.module.scss';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IProgressModalProps } from './IProgressModalProps';
import EditPropertiesLink from './EditPropertiesLink';

export default class ProgressModal extends React.Component<IProgressModalProps, {}> {
    public render(): React.ReactElement<IProgressModalProps> {
        return (
            <Modal
                isOpen={true}
                onDismiss={this.props.onDismiss}
                isBlocking={true}
                isDarkOverlay={true}>
                <div className={styles.progressModal}>
                    <div className={styles.progressModalBody}>
                        <div className={styles.modalTitle}>{strings.ProgressModalTitle}</div>
                        <div className={styles.progressIcon}>
                            <Icon iconName={this.props.iconName} style={{ fontSize: 42, display: 'block', textAlign: 'center' }} />
                        </div>
                        <div className={styles.progressIndicator}>
                            <ProgressIndicator label={this.props.text} description={this.props.subText} />
                        </div>
                    </div>
                    {(this.props.taskParams.entity && this.props.taskParams.entity.editFormUrl) && <EditPropertiesLink editFormUrl={this.props.taskParams.entity.editFormUrl} />}
                    <div className={styles.setupVersion}>{this.props.version}</div>
                </div>
            </Modal>
        );
    }
}

export { IProgressModalProps };