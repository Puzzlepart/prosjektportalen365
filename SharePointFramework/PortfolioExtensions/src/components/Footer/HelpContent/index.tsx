import { ActionButton } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext, useState } from 'react'
import { HelpContentModal } from './HelpContentModal'
import { FooterContext } from '../context'

export const HelpContent: FC = () => {
  const context = useContext(FooterContext)
  const [showModal, setShowModal] = useState(false)
  const isHidden = context.props.helpContent.length === 0
  return (
    <div style={{ display: isHidden ? 'none' : 'inline-block' }}>
      <ActionButton
        text={strings.HelpContentLinkText}
        iconProps={{ iconName: 'Help' }}
        styles={{ root: { fontSize: 12, height: 25 }, icon: { fontSize: 12 } }}
        onClick={() => setShowModal(true)}
      />
      <HelpContentModal isOpen={showModal} onDismiss={() => setShowModal(false)} />
    </div>
  )
}
