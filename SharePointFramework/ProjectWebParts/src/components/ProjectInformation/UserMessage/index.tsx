import { stringIsNullOrEmpty } from '@pnp/common';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import * as React from 'react';
import { IUserMessageProps } from './IUserMessageProps';

// tslint:disable-next-line: naming-convention
export const UserMessage = (props: IUserMessageProps) => {
    if (stringIsNullOrEmpty(props.text)) return null;
    return (
        <div className={props.className}>
            <MessageBar messageBarType={props.messageBarType}>
                {props.text}
            </MessageBar>
        </div>
    );
};

export * from './IUserMessageProps';
