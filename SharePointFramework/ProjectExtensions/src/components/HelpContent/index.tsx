import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import React, { FunctionComponent, useState } from 'react'
import styles from './HelpContent.module.scss'
import { HelpContentModal } from './HelpContentModal'
import { IHelpContentProps } from './types'

export const HelpContent: FunctionComponent<IHelpContentProps> = (props) => {
  const [showModal, setShowModal] = useState(false)
  return (
    <div className={styles.root}>
      <ActionButton
        text={props.linkText}
        iconProps={{ iconName: 'Help' }}
        onClick={() => setShowModal(true)}
      />
      <HelpContentModal
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        content={props.content}
      />
    </div>
  )
}

export * from './types'