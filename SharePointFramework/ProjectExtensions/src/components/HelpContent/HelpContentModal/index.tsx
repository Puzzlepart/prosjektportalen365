import { ActionButton } from 'office-ui-fabric-react/lib/Button';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
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
                <Pivot>
                    {props.content.map(c => (
                        <PivotItem headerText={c.title} itemIcon={c.iconName}>
                            <div className={styles.contentItem} title={c.title}>
                                <p>{c.textContent}</p>
                                {c.resourceLink && <ActionButton text={c.resourceLink.Description} iconProps={{ iconName: 'Page' }} href={c.resourceLink.Url} />}
                            </div>
                        </PivotItem>
                    ))}
                </Pivot>
            </div>
        </Modal>
    );
};



export { IHelpContentModalProps };

