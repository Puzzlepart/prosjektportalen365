import * as React from 'react';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import ProjectSetupBaseModal from '../ProjectSetupBaseModal';
import { IErrorModalProps } from './IErrorModalProps';

export default class ErrorModal extends React.PureComponent<IErrorModalProps, {}> {
    public render() {
        return (
            <ProjectSetupBaseModal
                title={this.props.error.message}
                isBlocking={false}
                isDarkOverlay={true}>
                <MessageBar messageBarType={this.props.error.type}>{this.props.error.stack}</MessageBar>
            </ProjectSetupBaseModal>
        );
    }
}

export { IErrorModalProps };