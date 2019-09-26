import * as React from 'react';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import { BaseDialog } from '../@BaseDialog';
import { IErrorDialogProps } from './IErrorDialogProps';

export default class ErrorDialog extends React.PureComponent<IErrorDialogProps, {}> {
    public render() {
        return (
            <BaseDialog
                version={this.props.version}
                dialogContentProps={{ title: this.props.error.message }}
                modalProps={{ isBlocking: false, isDarkOverlay: true }}
                onDismiss={this.props.onDismiss}>
                <MessageBar messageBarType={this.props.error.type}>{this.props.error.stack}</MessageBar>
            </BaseDialog>
        );
    }
}

export { IErrorDialogProps };