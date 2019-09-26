import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown/with-html';
import { IInfoMessageProps } from './IInfoMessageProps';
import styles from './InfoMessage.module.scss';

export class InfoMessage extends React.PureComponent<IInfoMessageProps, {}> {
    public render(): React.ReactElement<IInfoMessageProps> {
        return (
            <div className={styles.infoMessage}>
                <MessageBar>
                    <ReactMarkdown escapeHtml={false} linkTarget='_blank' source={this.props.text} />
                </MessageBar>
            </div>
        );
    }
}
