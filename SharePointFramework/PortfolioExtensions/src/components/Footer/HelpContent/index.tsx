import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext, useState } from 'react'
import { HelpContentModal } from './HelpContentModal'
import { FooterContext } from '../context'
import { Button, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

export const HelpContent: FC = () => {
  const context = useContext(FooterContext)
  const [showModal, setShowModal] = useState(false)
  const isUnavailable = context.props.helpContent.length === 0

  return (
    <>
      <Tooltip
        relationship='description'
        withArrow
        content={
          isUnavailable
            ? strings.HelpContentUnavailableDescription
            : strings.HelpContentAvailableDescription
        }
      >
        <Button
          size='small'
          appearance='subtle'
          onClick={() => setShowModal(true)}
          disabled={isUnavailable}
          icon={getFluentIcon('QuestionCircle')}
        >
          {isUnavailable ? strings.HelpContentUnavailableLabel : strings.HelpContentAvailableLabel}
        </Button>
      </Tooltip>
      <HelpContentModal isOpen={showModal} onDismiss={() => setShowModal(false)} />
    </>
  )
}
