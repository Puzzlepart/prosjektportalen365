import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  FluentProvider,
  IdPrefixProvider,
  OverlayDrawer,
  useId
} from '@fluentui/react-components'
import React, { FC } from 'react'
import strings from 'SharedLibraryStrings'
import { getFluentIcon } from '../../icons'
import { customLightTheme } from '../../util'
import styles from './BasePanel.module.scss'
import { IBasePanelProps } from './types'

/**
 * The panel every side panel in the solutions is built on. Renders a Fluent UI
 * v9 `OverlayDrawer` behind the prop names the v8 `Panel` used (`isOpen`,
 * `onDismiss`, `headerText`, `onRenderBody`, `onRenderFooterContent`), so call
 * sites did not have to change when it moved from v8 to v9.
 */
export const BasePanel: FC<IBasePanelProps> = ({
  $type,
  isOpen,
  onDismiss,
  headerText,
  size = 'medium',
  position = 'end',
  isLightDismiss = true,
  closeButtonAriaLabel = strings.CloseText,
  onRenderHeader,
  hidden,
  onRenderBody,
  onRenderFooterContent,
  children,
  className
}) => {
  const fluentProviderId = useId('fp-base-panel')
  const footer = onRenderFooterContent?.()

  return (
    <IdPrefixProvider value={fluentProviderId}>
      {/*
        `applyStylesToPortals` must stay at its default of true. A modal drawer
        renders in a portal, and with the flag off the portal receives none of
        the theme's styles, so the panel renders invisible. The old v8 BasePanel
        set it to false, but on a provider that sat *inside* the panel, where it
        only affected nested portals such as callouts.
      */}
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          className={className}
          open={isOpen}
          size={size}
          position={position}
          // Both branches are modal on purpose. A `non-modal` drawer renders
          // inline, so it stays inside the web part's stacking context and ends
          // up behind it; only a modal drawer portals out. `modal` dismisses on
          // a click on the dimmed background, `alert` requires an action.
          modalType={isLightDismiss ? 'modal' : 'alert'}
          onOpenChange={(_event, data) => {
            if (!data.open) onDismiss?.()
          }}
        >
          <DrawerHeader hidden={hidden}>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance='subtle'
                  aria-label={closeButtonAriaLabel}
                  icon={getFluentIcon('Dismiss')}
                  onClick={() => onDismiss?.()}
                />
              }
            >
              {onRenderHeader ? onRenderHeader() : headerText}
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody className={styles.body}>
            {onRenderBody?.()}
            {children}
          </DrawerBody>
          {footer && <DrawerFooter className={styles.footer}>{footer}</DrawerFooter>}
        </OverlayDrawer>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
