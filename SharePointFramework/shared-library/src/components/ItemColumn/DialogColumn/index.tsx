import strings from 'SharedLibraryStrings'
import React from 'react'
import { getFluentIcon } from '../../../icons'
import { checkboxField, textField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import styles from './DialogColumn.module.scss'
import { IDialogColumnProps } from './types'
import { useDialogColumn } from './useDialogColumn'
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Link,
  Text
} from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import { DataGridList } from '../../DataGridList'
import { UserMessage } from '../../UserMessage'
import { withDefaults } from '../../../util'

const DIALOG_COLUMN_DEFAULT_PROPS: Partial<IDialogColumnProps> = {
  linkText: strings.ShowAllMeasurementsLinkText,
  infoTextTemplate: ''
}

/**
 * Opens measurement history from a cell link, with configurable headings and information text.
 */
export const DialogColumn: ColumnRenderComponent<IDialogColumnProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, DIALOG_COLUMN_DEFAULT_PROPS)
  const { infoText, title, subTitle, items, columns, shouldRenderList } = useDialogColumn(props)

  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <Link>{props.linkText}</Link>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody className={styles.root}>
          <DialogTitle
            className={styles.title}
            hidden={stringIsNullOrEmpty(title)}
            action={
              <DialogTrigger action='close'>
                <Button
                  appearance='subtle'
                  icon={getFluentIcon('Dismiss')}
                  aria-label={strings.CloseText}
                  title={strings.CloseText}
                />
              </DialogTrigger>
            }
          >
            {title}
            <Text size={400}>{subTitle}</Text>
          </DialogTitle>
          <DialogContent>
            {infoText && (
              <Text size={200} className={styles.infoText}>
                {infoText}
              </Text>
            )}
            {shouldRenderList ? (
              <DataGridList items={items} columns={columns} />
            ) : (
              <UserMessage
                title={strings.ModalColumnEmptyListTitle}
                text={strings.ModalColumnEmptyListMessage}
              />
            )}
          </DialogContent>
          <DialogActions>
            <DialogTrigger action='close'>
              <Button appearance='secondary'>{strings.CloseText}</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
DialogColumn.key = 'modal'
DialogColumn.id = 'Modal'
DialogColumn.displayName = strings.ColumnRenderOptionDialog
DialogColumn.iconName = 'WindowEdit'
DialogColumn.isDisabled = true
DialogColumn.getDataTypeProperties = (onChange, dataTypeProperties) => [
  textField({
    label: strings.ColumnRenderOptionDialogLinkTextLabel,
    placeholder: DIALOG_COLUMN_DEFAULT_PROPS.linkText,
    value: dataTypeProperties.linkText,
    onChange: (value) => onChange('linkText', value)
  }),
  checkboxField({
    label: strings.ColumnRenderOptionDialogShowInfoTextLabel,
    checked: dataTypeProperties.showInfoText ?? DIALOG_COLUMN_DEFAULT_PROPS.showInfoText,
    onChange: (checked) => onChange('showInfoText', checked)
  }),
  textField({
    label: strings.ColumnRenderOptionDialogInfoTextTemplateLabel,
    description: strings.ColumnRenderOptionDialogInfoTextTemplateDescription,
    placeholder: DIALOG_COLUMN_DEFAULT_PROPS.infoTextTemplate,
    value: dataTypeProperties.infoTextTemplate,
    multiline: true,
    disabled: !dataTypeProperties.showInfoText,
    onChange: (value) => onChange('infoTextTemplate', value)
  })
]
