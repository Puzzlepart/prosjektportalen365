/* eslint-disable no-console */

import React, { FC, useContext, useState } from 'react'
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
                <DrawerHeaderTitle>Prosjektportalen assistent</DrawerHeaderTitle>
                <ToolbarGroup>
                  <ToolbarButton
                    appearance='subtle'
                    title='Innstillinger'
                    disabled={!context.props.pageContext.legacyPageContext.isSiteAdmin}
                    icon={getFluentIcon('Settings')}
                    onClick={() =>
                      window.open(
                        `${context.props.portalUrl}/Lists/Globale%20innstillinger`,
                        '_blank'
                      )
                    }
                  />
                  <ToolbarButton
                    title='Lukk'
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
                label='Laster inn assistenten...'
                style={{ padding: 10, minHeight: '20px' }}
              />
            )}
            <iframe
              src={`https://pp365-ai-d2dge4fqc2bhbba9.norwayeast-01.azurewebsites.net?source=${context.props.pageContext.web.absoluteUrl}`}
              style={{ display: loading ? 'none' : 'block', border: 'none' }}
              title='Assistent for Prosjektportalen 365'
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
            isUnavailable
              ? 'Assistenten er ikke tilgjengelig.'
              : 'Åpne assistenten for å ta i bruk kunstig intelligens i Prosjektportalen 365.'
          }
        >
          <Button
            appearance='primary'
            disabled={isUnavailable}
            icon={isUnavailable ? getFluentIcon('Bot') : getFluentIcon('BotSparkle')}
            onClick={() => setOpen(!open)}
          >
            Assistent
          </Button>
        </Tooltip>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
