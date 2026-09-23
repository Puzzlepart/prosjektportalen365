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
      <FluentProvider theme={customLightTheme} applyStylesToPortals={false}>
        <OverlayDrawer
          className={[className, styles.root].filter(Boolean).join(' ')}
          open={isOpen}
          size={size}
          position={position}
          // `modalType` is how v9 expresses light dismiss: a modal drawer keeps
          // focus and ignores clicks outside, an alert drawer does not dismiss.
          modalType={isLightDismiss ? 'non-modal' : 'alert'}
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
