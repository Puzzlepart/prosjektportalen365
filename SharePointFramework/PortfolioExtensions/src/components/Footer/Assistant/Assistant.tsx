/* eslint-disable no-console */

import React, { FC, useContext } from 'react'
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
  Toolbar,
  ToolbarButton,
  Spinner,
  DrawerHeaderTitle
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import styles from './Assistant.module.scss'
import resource from 'SharedResources'
import { useAssistant } from './useAssistant'

export const Assistant: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-assistant')
  const isUnavailable = false
  const { open, hasOpened, loading, close, toggle, setDrawerOpen, setLoading } = useAssistant()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          role='panel'
          position='end'
          className={styles.drawer}
          open={open}
          onOpenChange={(_, { open }) => setDrawerOpen(open)}
        >
          <DrawerHeader className={styles.header}>
            <div className={styles.title}>
              {getFluentIcon('BotSparkle', { filled: true, size: '24px' })}
              <DrawerHeaderTitle>{strings.AssistantDrawerTitle}</DrawerHeaderTitle>
            </div>
            <Toolbar className={styles.actions}>
              <ToolbarButton
                appearance='subtle'
                title={strings.AssistantSettingsTooltip}
                disabled={!context.props.pageContext.legacyPageContext.isSiteAdmin}
                icon={getFluentIcon('Settings')}
                onClick={() =>
                  window.open(
                    `${context.props.portalUrl}/${resource.Lists_Global_Settings_Url}`,
                    '_blank'
                  )
                }
              />
              <ToolbarButton
                title={strings.CloseLabel}
                appearance='subtle'
                icon={getFluentIcon('Dismiss')}
                onClick={close}
              />
            </Toolbar>
          </DrawerHeader>
          <DrawerBody className={styles.body} style={{ padding: 0 }}>
            {loading && (
              <Spinner
                size='extra-tiny'
                label={strings.AssistantLoadingText}
                style={{ padding: 10, minHeight: '20px' }}
              />
            )}
            {hasOpened && (
              <iframe
                src={`${context.props.assistantEndpointUrl}?source=${context.props.pageContext.web.absoluteUrl}`}
                style={{ display: loading ? 'none' : 'block', border: 'none' }}
                title={strings.AssistantIframeTitle}
                width='100%'
                height='100%'
                onLoad={() => setLoading(false)}
              />
            )}
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
            onClick={toggle}
          >
            {strings.AssistantButtonLabel}
          </Button>
        </Tooltip>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
