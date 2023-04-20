import { ActionButton } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useState } from 'react'
import styles from './HelpContent.module.scss'
import { HelpContentModal } from './HelpContentModal'

export const HelpContent: FC = () => {
    const [showModal, setShowModal] = useState(false)
    return (
        <div className={styles.root}>
            <ActionButton
                text={strings.HelpContentLinkText}
                iconProps={{ iconName: 'Help' }}
                styles={{ root: { fontSize: 12, height: 25 }, icon: { fontSize: 12 } }}
                onClick={() => setShowModal(true)}
            />
            <HelpContentModal
                isOpen={showModal}
                onDismiss={() => setShowModal(false)}
            />
        </div>
    )
}
