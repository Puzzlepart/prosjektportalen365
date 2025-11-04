import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { HelpContentDialog } from './HelpContentDialog'
import { FooterContext } from '../context'
import {
  Button,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'

export const HelpContent: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-help-content')
  const isUnavailable = context.props.helpContent.length === 0

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
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
              {isUnavailable
                ? strings.HelpContentUnavailableLabel
                : strings.HelpContentAvailableLabel}
            </Button>
          </Tooltip>
        </HelpContentDialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
