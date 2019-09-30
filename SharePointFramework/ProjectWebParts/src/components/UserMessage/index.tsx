import { stringIsNullOrEmpty } from '@pnp/common';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as React from 'react';
import { IUserMessageProps } from './IUserMessageProps';
import * as ReactMarkdown from 'react-markdown/with-html';

// tslint:disable-next-line: naming-convention
export const UserMessage = ({ className, text, messageBarType, onDismiss = null, style, hidden }: IUserMessageProps) => {
    if (stringIsNullOrEmpty(text)) return null;
    return (
        <div className={className} style={style} hidden={hidden}>
            <MessageBar messageBarType={messageBarType} onDismiss={onDismiss}>
                <ReactMarkdown escapeHtml={false} source={text} />
            </MessageBar>
        </div>
    );
};

export { MessageBarType };
export * from './IUserMessageProps';

