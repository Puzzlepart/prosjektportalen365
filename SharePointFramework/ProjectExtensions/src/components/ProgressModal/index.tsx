import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import ProjectSetupBaseModal from '../ProjectSetupBaseModal';
import { IProgressModalProps } from './IProgressModalProps';
import styles from './ProgressModal.module.scss';

export default class ProgressModal extends React.PureComponent<IProgressModalProps, {}>{
    public render() {
        return (
            <ProjectSetupBaseModal
                title={strings.ProgressModalTitle}
                isBlocking={true}
                isDarkOverlay={true}
                containerClassName={styles.progressModal}>
                <div className={styles.progressIcon}>
                    <Icon iconName={this.props.iconName} style={{ fontSize: 42, display: 'block', textAlign: 'center' }} />
                </div>
                <div className={styles.progressIndicator}>
                    <ProgressIndicator label={this.props.text} description={this.props.subText} />
                </div>
            </ProjectSetupBaseModal>
        );
    }
}

export { IProgressModalProps };
