import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { HelpContentDialog } from './HelpContentDialog'
import { FooterContext } from '../context'
import { Button, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

export const HelpContent: FC = () => {
  const context = useContext(FooterContext)
  const isUnavailable = context.props.helpContent.length === 0

  return (
    <HelpContentDialog>
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
          disabled={isUnavailable}
          icon={getFluentIcon('QuestionCircle')}
        >
          {isUnavailable ? strings.HelpContentUnavailableLabel : strings.HelpContentAvailableLabel}
        </Button>
      </Tooltip>
    </HelpContentDialog>
  )
}
