/* eslint-disable no-console */

import React, { FC, useContext, useState } from 'react'
import * as strings from 'PortfolioExtensionsStrings'
import { FooterContext } from '../context'
import {
  OverlayDrawer,
  IdPrefixProvider,
  FluentProvider,
  useId,
  Tooltip,
  Button,
  DrawerHeader,
  DrawerBody,
  DrawerHeaderNavigation,
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  Spinner,
  DrawerHeaderTitle
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import styles from './Assistant.module.scss'
import resource from 'SharedResources'

export const Assistant: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-assistant')
  const isUnavailable = false
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          role='panel'
          position='end'
          size='medium'
          open={open}
          onOpenChange={(_, { open }) => setOpen(open)}
        >
          <DrawerHeader>
            <DrawerHeaderNavigation>
              <Toolbar className={styles.toolbar}>
                <DrawerHeaderTitle>{strings.AssistantDrawerTitle}</DrawerHeaderTitle>
                <ToolbarGroup>
                  <ToolbarButton
                    appearance='subtle'
                    title={strings.AssistantSettingsTooltip}
                    disabled={!context.props.pageContext.legacyPageContext.isSiteAdmin}
                    icon={getFluentIcon('Settings')}
                    onClick={() =>
                      window.open(
                        `${context.props.portalUrl}/Lists/${resource.Lists_Global_Settings_Url}`,
                        '_blank'
                      )
                    }
                  />
                  <ToolbarButton
                    title={strings.CloseLabel}
                    appearance='subtle'
                    icon={getFluentIcon('Dismiss')}
                    onClick={() => setOpen(false)}
                  />
                </ToolbarGroup>
              </Toolbar>
            </DrawerHeaderNavigation>
          </DrawerHeader>
          <DrawerBody className={styles.body}>
            {loading && (
              <Spinner
                size='extra-tiny'
                label={strings.AssistantLoadingText}
                style={{ padding: 10, minHeight: '20px' }}
              />
            )}
            <iframe
              src={`${context.props.assistantEndpointUrl}?source=${context.props.pageContext.web.absoluteUrl}`}
              style={{ display: loading ? 'none' : 'block', border: 'none' }}
              title={strings.AssistantIframeTitle}
              width='100%'
              height='100%'
              onLoad={() => setLoading(false)}
            />
          </DrawerBody>
        </OverlayDrawer>
        <Tooltip
          relationship='description'
          withArrow
          content={
            isUnavailable ? strings.AssistantTooltipUnavailable : strings.AssistantTooltipAvailable
          }
        >
          <Button
            appearance='primary'
            disabled={isUnavailable}
            icon={isUnavailable ? getFluentIcon('Bot') : getFluentIcon('BotSparkle')}
            onClick={() => setOpen(!open)}
          >
            {strings.AssistantButtonLabel}
          </Button>
        </Tooltip>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
