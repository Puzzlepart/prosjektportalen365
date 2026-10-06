import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Input,
  makeStyles,
  tokens
} from '@fluentui/react-components'
import { Copy24Regular } from '@fluentui/react-icons'
import strings from 'ProjectWebPartsStrings'
import { UserMessage } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ICopyLinkDialogProps } from './types'

const useStyles = makeStyles({
  surface: {
    maxWidth: '560px'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM
  },
  linkRow: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalS
  },
  link: {
    flexGrow: 1,
    minWidth: 0
  }
})

/**
 * Confirms that the link to the snapshot was copied, shows it for copying by hand when the
 * clipboard is not available, and says who can open it.
 */
export const CopyLinkDialog: FC<ICopyLinkDialogProps> = (props) => {
  const styles = useStyles()

  return (
    <Dialog open={props.open} onOpenChange={(_, data) => !data.open && props.onDismiss()}>
      <DialogSurface className={styles.surface} mountNode={props.mountNode}>
        <DialogBody>
          <DialogTitle>{strings.SnapshotCopyLinkDialogTitle}</DialogTitle>
          <DialogContent className={styles.content}>
            {props.status && (
              <UserMessage
                intent={props.status === 'copied' ? 'success' : 'warning'}
                text={
                  props.status === 'copied'
                    ? strings.SnapshotLinkCopiedText
                    : strings.SnapshotLinkCopyFailedText
                }
              />
            )}
            <div className={styles.linkRow}>
              <Input
                className={styles.link}
                readOnly
                value={props.link}
                aria-label={strings.SnapshotLinkInputLabel}
                onFocus={(event) => event.target.select()}
              />
              <Button icon={<Copy24Regular />} onClick={props.onCopy}>
                {strings.SnapshotCopyButtonLabel}
              </Button>
            </div>
            <UserMessage intent='info' text={strings.SnapshotLinkAccessText} />
          </DialogContent>
          <DialogActions>
            <Button appearance='primary' onClick={props.onDismiss}>
              {strings.CloseText}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

CopyLinkDialog.displayName = 'CopyLinkDialog'
