import * as React from 'react';
import { useState } from 'react';
import { IHelpContentProps } from './IHelpContentProps';
import styles from './HelpContent.module.scss';
import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { HelpContentModal } from './HelpContentModal';

// tslint:disable-next-line: naming-convention
export const HelpContent = (props: IHelpContentProps) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className={styles.helpContent}>
            <ActionButton text={props.linkText} iconProps={{ iconName: 'Help' }} onClick={_ => setShowModal(true)} />
            <HelpContentModal
                isOpen={showModal}
                onDismiss={_ => setShowModal(false)}
                content={props.content} />
        </div>
    );
};



export { IHelpContentProps };

