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

/** Opens page help and explains when no help entries are available. */
export const HelpContent: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-help-content')
  const isUnavailable = context.isHelpContentLoaded && context.helpContent.length === 0
  // Until the help is loaded the button cannot know whether the page has any: «Hjelp tilgjengelig»
  // opened a dialog that said there was none (Puzzlepart/prosjektportalen365-testing#137).
  const label = isUnavailable
    ? strings.HelpContentUnavailableLabel
    : context.isHelpContentLoaded
      ? strings.HelpContentAvailableLabel
      : strings.HelpContentLabel

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
            {/* Focusable while it cannot be used: the description says why (WCAG 2.1.1). */}
            <Button
              size='small'
              appearance='subtle'
              disabledFocusable={isUnavailable}
              icon={getFluentIcon('QuestionCircle')}
            >
              {label}
            </Button>
          </Tooltip>
        </HelpContentDialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
