import * as React from 'react';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import { BaseDialog } from '../@BaseDialog';
import { IErrorModalProps } from './IErrorModalProps';

export default class ErrorModal extends React.PureComponent<IErrorModalProps, {}> {
    public render() {
        return (
            <BaseDialog
                title={this.props.error.message}
                modalProps={{ isBlocking: false, isDarkOverlay: true }}
                onDismiss={this.props.onDismiss}>
                <MessageBar messageBarType={this.props.error.type}>{this.props.error.stack}</MessageBar>
            </BaseDialog>
        );
    }
}

export { IErrorModalProps };