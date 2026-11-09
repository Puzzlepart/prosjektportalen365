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
  DrawerHeaderTitle,
  useRestoreFocusTarget
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
  // The drawer opens from state, with no trigger of Fluent's: the button is where the focus goes
  // back as it closes (WCAG 2.4.3).
  const restoreFocusTarget = useRestoreFocusTarget()
  const isSiteAdmin = context.props.pageContext.legacyPageContext.isSiteAdmin

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        {/* A dialog, named by its title: its role was 'panel', which is no role (WCAG 4.1.2). */}
        <OverlayDrawer
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
              {/* The settings are a list, so a link, for site admins only: a link cannot be
                  disabled, and a disabled button said nothing of why. Both are named, where a
                  title was all (WCAG 4.1.2). */}
              {isSiteAdmin && (
                <ToolbarButton
                  as='a'
                  appearance='subtle'
                  aria-label={strings.AssistantSettingsTooltip}
                  icon={getFluentIcon('Settings')}
                  href={`${context.props.portalUrl}/${resource.Lists_Global_Settings_Url}`}
                  target='_blank'
                />
              )}
              <ToolbarButton
                aria-label={strings.CloseLabel}
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
                allow='clipboard-write'
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
            {...restoreFocusTarget}
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
