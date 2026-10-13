import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
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
    maxWidth: '640px'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM
  },
  linkRow: {
    display: 'flex',
    alignItems: 'flex-end',
    columnGap: tokens.spacingHorizontalS
  },
  link: {
    flexGrow: 1,
    minWidth: 0
  }
})

/**
 * Confirms that a link to the snapshot was copied, shows the link to the status page with the
 * snapshot and the direct link to the image file for copying, and says who can open them.
 */
export const CopyLinkDialog: FC<ICopyLinkDialogProps> = (props) => {
  const styles = useStyles()
  const links = [
    { label: strings.SnapshotPageLinkLabel, value: props.pageLink, onCopy: props.onCopyPageLink },
    { label: strings.SnapshotImageLinkLabel, value: props.imageLink, onCopy: props.onCopyImageLink }
  ]

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
            {links.map((link) => (
              <div key={link.label} className={styles.linkRow}>
                <Field className={styles.link} label={link.label}>
                  <Input readOnly value={link.value} onFocus={(event) => event.target.select()} />
                </Field>
                <Button icon={<Copy24Regular />} onClick={link.onCopy}>
                  {strings.SnapshotCopyButtonLabel}
                </Button>
              </div>
            ))}
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
