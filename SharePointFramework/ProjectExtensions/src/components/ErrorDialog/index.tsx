import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { BaseDialog } from '../@BaseDialog';
import * as ReactMarkdown from 'react-markdown/with-html';
import styles from './ErrorDialog.module.scss';
import { IErrorDialogProps } from './IErrorDialogProps';

// tslint:disable-next-line: naming-convention
export const ErrorDialog = ({ error, version, messageType = MessageBarType.error, onDismiss }: IErrorDialogProps) => {
    const onRenderFooter = () => {
        return (
            <>
                <DefaultButton text={strings.CloseModalText} onClick={onDismiss} />
            </>
        );
    };

    return (
        <BaseDialog
            version={version}
            dialogContentProps={{ title: error.message }}
            modalProps={{ isBlocking: false, isDarkOverlay: true }}
            onRenderFooter={onRenderFooter}
            onDismiss={onDismiss}
            containerClassName={styles.errorDialog}>
            <div style={{ marginTop: 15 }}>
                <MessageBar messageBarType={messageType} className={styles.errorMessage}>
                    <ReactMarkdown escapeHtml={false} linkTarget='_blank' source={error.stack} html />
                </MessageBar>
            </div>
        </BaseDialog >
    );
};

export { IErrorDialogProps };

