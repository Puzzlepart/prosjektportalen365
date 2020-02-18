import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import * as React from 'react';
import styles from './HelpContentModal.module.scss';
import { IHelpContentModalProps } from './IHelpContentModalProps';

// tslint:disable-next-line: naming-convention
export const HelpContentModal = (props: IHelpContentModalProps) => {
    return (
        <Modal
            isOpen={props.isOpen}
            isBlocking={false}
            onDismiss={props.onDismiss}
            containerClassName={styles.helpContentModal}>
            <div className={styles.body}>
                {props.content.map(c => (
                    <div className={styles.contentItem} title={c.title}>
                        <h4>{c.title}</h4>
                        <p>{c.text}</p>
                        {c.resource && <ActionButton text={c.resource.Description} iconProps={{ iconName: 'Page' }} href={c.resource.Url} />}
                    </div>
                ))}
            </div>
        </Modal>
    );
};



export { IHelpContentModalProps };

