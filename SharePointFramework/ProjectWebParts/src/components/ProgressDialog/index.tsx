import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { Dialog } from 'office-ui-fabric-react/lib/Dialog';
import * as React from 'react';
import styles from './ProgressDialog.module.scss';
import { IProgressDialogProps } from './IProgressDialogProps';

// tslint:disable-next-line: naming-convention
export const ProgressDialog = ({ title, progress }: IProgressDialogProps) => {
    if (!progress) return null;
    return (
        <Dialog
            hidden={false}
            dialogContentProps={{ title }}
            modalProps={{ isBlocking: true, isDarkOverlay: true }}
            containerClassName={styles.progressDialog}>
            <ProgressIndicator  {...progress} />
        </Dialog>
    );
};