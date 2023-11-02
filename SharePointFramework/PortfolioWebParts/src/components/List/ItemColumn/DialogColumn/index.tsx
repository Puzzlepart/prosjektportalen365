import { Checkbox, TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import styles from './DialogColumn.module.scss'
import { IDialogColumnProps } from './types'
import { useDialogColumn } from './useDialogColumn'
import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Link,
  Text
} from '@fluentui/react-components'
import { stringIsNullOrEmpty } from '@pnp/core'
import { UserMessage } from 'pp365-shared-library'

/**
 * A column render component that displays a link in the cell. When the link is clicked, a dialog is displayed
 * that shows a list of items with columns. The columns can be customized using the `columns` prop. The link text can
 * be customized using the `linkText` prop. The component also supports showing an information text below the list of items
 * using the `infoTextTemplate` prop. The information text can be customized using placeholders such as `{{Title}}` and
 * `{{Count}}`. The `{{Title}}` placeholder will be replaced with the title of the column.
 *
 * @param props - The props for the component.
 * @param props.linkText - The text to display in the link.
 * @param props.selectionMode - The selection mode for the list of items.
 * @param props.infoTextTemplate - The template for the information text to display below the list of items.
 * @param props.showInfoText - Whether to show the information text.
 */
export const DialogColumn: ColumnRenderComponent<IDialogColumnProps> = (props) => {
  const { infoText, title, subTitle, items, columns, columnSizingOptions, shouldRenderList } =
    useDialogColumn(props)

  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <Link>{props.linkText}</Link>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody className={styles.root}>
          <DialogTitle className={styles.title} hidden={stringIsNullOrEmpty(title)}>
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
              <DataGrid
                items={items}
                columns={columns}
                resizableColumns
                columnSizingOptions={columnSizingOptions}
              >
                <DataGridHeader>
                  <DataGridRow>
                    {({ renderHeaderCell }) => (
                      <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                    )}
                  </DataGridRow>
                </DataGridHeader>
                <DataGridBody>
                  {({ item, rowId }) => (
                    <DataGridRow key={rowId}>
                      {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                    </DataGridRow>
                  )}
                </DataGridBody>
              </DataGrid>
            ) : (
              <UserMessage
                title={strings.ModalColumnEmptyListTitle}
                message={strings.ModalColumnEmptyListMessage}
              />
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

DialogColumn.defaultProps = {
  linkText: strings.ShowAllMeasurementsLinkText,
  infoTextTemplate: ''
}
DialogColumn.key = 'modal'
DialogColumn.id = 'Modal'
DialogColumn.displayName = strings.ColumnRenderOptionDialog
DialogColumn.iconName = 'WindowEdit'
DialogColumn.isDisabled = true
DialogColumn.getDataTypeProperties = (onChange, dataTypeProperties) => [
  ColumnDataTypePropertyField(TextField, {
    label: strings.ColumnRenderOptionDialogLinkTextLabel,
    placeholder: DialogColumn.defaultProps.linkText,
    value: dataTypeProperties['linkText'],
    onChange: (_, value) => onChange('linkText', value)
  }),
  ColumnDataTypePropertyField(Checkbox, {
    label: strings.ColumnRenderOptionDialogShowInfoTextLabel,
    defaultChecked: DialogColumn.defaultProps.showInfoText,
    checked: dataTypeProperties.showInfoText,
    onChange: (_, value) => onChange('showInfoText', value)
  }),
  ColumnDataTypePropertyField(TextField, {
    label: strings.ColumnRenderOptionDialogInfoTextTemplateLabel,
    description: strings.ColumnRenderOptionDialogInfoTextTemplateDescription,
    placeholder: DialogColumn.defaultProps.infoTextTemplate,
    value: dataTypeProperties.infoTextTemplate,
    multiline: true,
    disabled: !dataTypeProperties.showInfoText,
    onChange: (_, value) => onChange('infoTextTemplate', value)
  })
]
