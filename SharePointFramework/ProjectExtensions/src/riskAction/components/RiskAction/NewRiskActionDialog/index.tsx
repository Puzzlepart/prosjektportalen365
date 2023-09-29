import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Field,
  Link,
  Textarea,
  Tooltip
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { IRiskActionProps } from '../types'
import styles from './NewRiskActionDialog.module.scss'
import { useNewRiskActionDialog } from './useNewRiskActionDialog'

/**
 * A dialog component for adding a new risk action.
 */
export const NewRiskActionDialog: FC<IRiskActionProps> = (props) => {
  const {
    title,
    setTitle,
    description,
    setDescription,
    onSave,
    tooltipContent,
    open,
    setOpen,
    isSaving
  } = useNewRiskActionDialog(props)
  return (
    <Dialog open={open} onOpenChange={(_evt, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Tooltip content={tooltipContent} relationship='label'>
          <Link appearance='default' className={styles.dialogTrigger}>
            Legg til nytt tiltak
          </Link>
        </Tooltip>
      </DialogTrigger>
      <DialogSurface className={styles.dialog}>
        <DialogTitle className={styles.title}>
          Legg til nytt tiltak for {props.itemContext.title}
        </DialogTitle>
        <DialogContent>
          <Field label='Tittel'>
            <Textarea onChange={(_ev, { value }) => setTitle(value)} value={title} />
          </Field>
          <Field label='Beskrivelse'>
            <Textarea onChange={(_ev, { value }) => setDescription(value)} value={description} />
          </Field>
        </DialogContent>
        <DialogActions className={styles.actions}>
          <Button
            appearance='primary'
            onClick={onSave}
            disabled={!title || isSaving}   >
            Lagre
          </Button>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance='secondary'>Avbryt</Button>
          </DialogTrigger>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  )
}
