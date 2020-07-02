import * as React from 'react'
import styles from './BaseDialog.module.scss'
import { Dialog, DialogFooter, DialogType, IDialogContentProps } from 'office-ui-fabric-react/lib/Dialog'
import { IModalProps } from 'office-ui-fabric-react/lib/Modal'
import { IBaseDialogProps } from './IBaseDialogProps'

export class BaseDialog extends React.PureComponent<IBaseDialogProps, {}> {
    public static defaultProps: Partial<IBaseDialogProps> = { onRenderFooter: () => null };

    public render(): React.ReactElement<IBaseDialogProps> {
        return (
            <Dialog
                hidden={false}
                modalProps={this._modalProps}
                dialogContentProps={this._dialogContentProps}
                onDismiss={this.props.onDismiss}>
                <span hidden={!this.props.version} className={styles.version}>v{this.props.version}</span>
                {this.props.children}
                <DialogFooter className={styles.footer}>
                    {this.props.onRenderFooter()}
                </DialogFooter>
            </Dialog>
        )
    }

    private get _modalProps(): IModalProps {
        return { containerClassName: this._containerClassName, ...this.props.modalProps, onDismiss: this.props.onDismiss }
    }

    private get _dialogContentProps(): IDialogContentProps {
        return { type: DialogType.largeHeader, ...this.props.dialogContentProps, onDismiss: this.props.onDismiss }
    }

    private get _containerClassName(): string {
        return [styles.baseDialog, this.props.containerClassName].filter(c => c).join(' ')
    }
}
