import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  FluentProvider,
  IdPrefixProvider,
  Tooltip,
  useId
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './BaseDialog.module.scss'
import { IBaseDialogProps } from './types'

export const BaseDialog: FC<IBaseDialogProps> = (props) => {
  const fluentProviderId = useId('base-dialog-')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.fluentProvider}>
        <Dialog
          modalType={props.isBlocking ? 'alert' : 'modal'}
          open={true}
          onOpenChange={(_, data) => {
            if (!data.open) props.onDismiss?.()
          }}
        >
          <DialogSurface className={props.containerClassName}>
            {props.version && (
              <Tooltip content={props.versionTooltip ?? props.version} relationship='label'>
                <span className={styles.version}>{props.version}</span>
              </Tooltip>
            )}
            <DialogBody className={styles.body}>
              <DialogTitle
                action={
                  !props.isBlocking ? (
                    <DialogTrigger action='close'>
                      <Button appearance='subtle' icon={getFluentIcon('Dismiss')} />
                    </DialogTrigger>
                  ) : undefined
                }
              >
                {props.title}
              </DialogTitle>
              {props.subText && <p className={styles.subText}>{props.subText}</p>}
              <DialogContent className={props.contentClassName}>{props.children}</DialogContent>
              {props.footer && <DialogActions>{props.footer}</DialogActions>}
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
