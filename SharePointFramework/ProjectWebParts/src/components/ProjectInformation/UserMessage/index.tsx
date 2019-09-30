import { stringIsNullOrEmpty } from '@pnp/common';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as React from 'react';
import { IUserMessageProps } from './IUserMessageProps';
import styles from './UserMessage.module.scss';
import * as ReactMarkdown from 'react-markdown/with-html';

// tslint:disable-next-line: naming-convention
export const UserMessage = (props: IUserMessageProps) => {
    if (stringIsNullOrEmpty(props.text)) return null;
    return (
        <div className={styles.userMessage} style={props.style}>
            <MessageBar messageBarType={props.messageBarType}>
                <ReactMarkdown escapeHtml={false} source={props.text} />
            </MessageBar>
        </div>
    );
};

export { MessageBarType };
export * from './IUserMessageProps';

