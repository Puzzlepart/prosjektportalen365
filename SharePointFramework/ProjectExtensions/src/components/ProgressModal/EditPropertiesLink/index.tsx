import * as React from 'react';
import styles from './EditPropertiesLink.module.scss';
import { IEditPropertiesLinkProps } from './IEditPropertiesLinkProps';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as stringFormat from 'string-format';

export default (props: IEditPropertiesLinkProps) => {
    return (
        <div className={styles.editPropertiesLink}>
            <MessageBar>
                <div dangerouslySetInnerHTML={{ __html: stringFormat(strings.EditPropertiesLinkText, props.editFormUrl) }}></div>
            </MessageBar>
        </div>
    );
};