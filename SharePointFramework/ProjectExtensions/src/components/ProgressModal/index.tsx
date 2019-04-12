import * as React from 'react';
import styles from './ProgressModal.module.scss';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IProgressModalProps } from './IProgressModalProps';
import ProjectSetupBaseModal from '../ProjectSetupBaseModal';
import EditPropertiesLink from './EditPropertiesLink';

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
                {(this.props.taskParams.entity && this.props.taskParams.entity.editFormUrl) && <EditPropertiesLink editFormUrl={this.props.taskParams.entity.editFormUrl} />}
            </ProjectSetupBaseModal>
        );
    }
}

export { IProgressModalProps };