import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { BaseDialog } from '../@BaseDialog';
import styles from './ErrorDialog.module.scss';
import { IErrorDialogProps } from './IErrorDialogProps';

export class ErrorDialog extends React.PureComponent<IErrorDialogProps> {
    public render() {
        return (
            <BaseDialog
                version={this.props.version}
                dialogContentProps={{ title: this.props.error.message }}
                modalProps={{ isBlocking: false, isDarkOverlay: true }}
                onRenderFooter={this._onRenderFooter.bind(this)}
                onDismiss={this.props.onDismiss}
                containerClassName={styles.errorDialog}>
                <div style={{ marginTop: 15 }}>
                    <MessageBar messageBarType={this.props.messageType || MessageBarType.error}>
                        <span>{this.props.error.stack}</span>
                    </MessageBar>
                </div>
            </BaseDialog >
        );
    }

    /**
     * On render footrer
     */
    private _onRenderFooter() {
        return (
            <>
                <DefaultButton text={strings.CloseModalText} onClick={this.props.onDismiss} />
            </>
        );
    }
}

export { IErrorDialogProps };

