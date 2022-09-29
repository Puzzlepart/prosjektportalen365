import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import * as React from 'react'
import { useState } from 'react'
import styles from './HelpContent.module.scss'
import { HelpContentModal } from './HelpContentModal'
import { IHelpContentProps } from './IHelpContentProps'

// tslint:disable-next-line: naming-convention
export const HelpContent = (props: IHelpContentProps) => {
    const [showModal, setShowModal] = useState(false)

    return (
        <div className={styles.helpContent}>
            <ActionButton text={props.linkText} iconProps={{ iconName: 'Help' }} onClick={() => setShowModal(true)} />
            <HelpContentModal
                isOpen={showModal}
                onDismiss={() => setShowModal(false)}
                content={props.content} />
        </div>
    )
}



export { IHelpContentProps }

