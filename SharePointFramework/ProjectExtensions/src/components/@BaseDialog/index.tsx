import * as React from 'react';
import styles from './BaseDialog.module.scss';
import { Dialog, DialogContent, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { IBaseDialogProps } from './IBaseDialogProps';

export class BaseDialog extends React.PureComponent<IBaseDialogProps, {}> {
    /**
     * Constructor
     * 
     * @param {IBaseDialogProps} props Props
     */
    constructor(props: IBaseDialogProps) {
        super(props);
        this.state = { isOpen: true };
    }

    public render(): React.ReactElement<IBaseDialogProps> {
        return (
            <Dialog
                hidden={false}
                modalProps={this.props.modalProps}
                dialogContentProps={{
                    type: DialogType.largeHeader,
                    ...this.props.dialogContentProps,
                }}
                onDismiss={this.props.onDismiss}
                containerClassName={`${styles.baseDialog} ${this.props.containerClassName}`}>
                <span className={styles.version}>v{this.props.version}</span>
                <DialogContent className={`${styles.content} ${this.props.contentClassName}`}>
                    {this.props.children}
                </DialogContent>
                {this.props.onRenderFooter ? <DialogFooter>{this.props.onRenderFooter()}</DialogFooter> : null}
            </Dialog>
        );
    }
}
