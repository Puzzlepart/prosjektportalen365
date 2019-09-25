import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { BaseDialog } from '../@BaseDialog';
import { IProgressModalProps } from './IProgressModalProps';
import styles from './ProgressModal.module.scss';

export default class ProgressModal extends React.PureComponent<IProgressModalProps, {}>{
    public render() {
        return (
            <BaseDialog
                title={strings.ProgressModalTitle}
                modalProps={{ isBlocking: true, isDarkOverlay: true }}
                dialogContentProps={{ title: strings.ProgressModalTitle }}
                onDismiss={this.props.onDismiss}
                containerClassName={styles.progressModal}>
                <div className={styles.progressIcon}>
                    <Icon iconName={this.props.iconName} style={{ fontSize: 42, display: 'block', textAlign: 'center' }} />
                </div>
                <div className={styles.progressIndicator}>
                    <ProgressIndicator label={this.props.text} description={this.props.subText} />
                </div>
            </BaseDialog>
        );
    }
}

export { IProgressModalProps };
