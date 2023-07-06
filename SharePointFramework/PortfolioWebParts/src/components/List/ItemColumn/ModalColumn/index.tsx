import {
  Checkbox,
  DetailsList,
  ICheckboxProps,
  IColumn,
  ITextFieldProps,
  Link,
  Modal,
  SelectionMode,
  TextField
} from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared-library'
import React, { useState } from 'react'
import { ColumnRenderComponent } from '../types'
import styles from './ModalColumn.module.scss'
import { columns } from './columns'
import { IModalColumnProps } from './types'
import { useInfoText } from './useInfoText'
import { IColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponentRegistry } from '../registry'

/**
 * A column render component that displays a link in the cell. When the link is clicked, a modal dialog is displayed
 * that shows a list of items with columns. The columns can be customized using the `columns` prop. The link text can
 * be customized using the `linkText` prop. The modal dialog can be customized using various props such as `isDarkOverlay`,
 * `isBlocking`, and `containerClassName`. The component also supports showing an information text below the list of items
 * using the `infoTextTemplate` prop. The information text can be customized using placeholders such as `{{Title}}` and
 * `{{Count}}`. The `{{Title}}` placeholder will be replaced with the title of the column.
 *
 * @param props - The props for the component.
 * @param props.items - The items to display in the modal dialog.
 * @param props.columns - The columns to display in the modal dialog.
 * @param props.linkText - The text to display in the link.
 * @param props.isDarkOverlay - Whether to use a dark overlay for the modal dialog.
 * @param props.isBlocking - Whether to block the UI when the modal dialog is displayed.
 * @param props.selectionMode - The selection mode for the list of items.
 * @param props.header - The header to display in the modal dialog.
 * @param props.infoTextTemplate - The template for the information text to display below the list of items.
 * @param props.showInfoText - Whether to show the information text.
 */
export const ModalColumn: ColumnRenderComponent<IModalColumnProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false)
  const infoText = useInfoText(props)

  const onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    const fieldNameDisplay: string = get(column, 'data.fieldNameDisplay', null)
    return column.onRender
      ? column.onRender(item, index, column)
      : get(item, fieldNameDisplay ?? column.fieldName, null)
  }

  return (
    <div>
      <Link onClick={() => setIsOpen(true)}>{props.linkText}</Link>
      <Modal
        isOpen={isOpen}
        isDarkOverlay={props.isDarkOverlay}
        isBlocking={props.isBlocking}
        containerClassName={styles.root}
        onDismiss={() => setIsOpen(false)}
      >
        <div className={styles.header} hidden={stringIsNullOrEmpty(props.header?.title)}>
          <div className={styles.title}>{props.header?.title}</div>
          <div className={styles.subTitle}>{props.header?.subTitle}</div>
        </div>
        {infoText && <p className={styles.infoText}>{infoText}</p>}
        <DetailsList
          items={props.items}
          columns={props.columns}
          onRenderItemColumn={onRenderItemColumn}
          selectionMode={props.selectionMode}
        />
      </Modal>
    </div>
  )
}

ModalColumn.defaultProps = {
  linkText: strings.ShowAllMeasurementsLinkText,
  isDarkOverlay: true,
  isBlocking: false,
  columns,
  selectionMode: SelectionMode.none,
  infoTextTemplate: strings.ShowAllMeasurementsInfoTextFormat
}
ModalColumn.key = 'modal'
ModalColumn.id = 'Modal'
ModalColumn.displayName = strings.ColumnRenderOptionModal
ModalColumn.iconName = 'WindowEdit'
ColumnRenderComponentRegistry.register(
  ModalColumn,
  (onChange, dataTypeProperties: Record<string, any>) => [
    {
      type: TextField,
      props: {
        label: strings.ColumnRenderOptionModalLinkTextLabel,
        placeholder: ModalColumn.defaultProps.linkText,
        value: dataTypeProperties['linkText'],
        onChange: (_, value) => onChange('linkText', value)
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>,
    {
      type: Checkbox,
      props: {
        label: strings.ColumnRenderOptionModalShowInfoTextLabel,
        defaultChecked: ModalColumn.defaultProps.showInfoText,
        checked: dataTypeProperties.showInfoText,
        onChange: (_, value) => onChange('showInfoText', value)
      }
    } as IColumnDataTypePropertyField<ICheckboxProps>,
    {
      type: TextField,
      props: {
        label: strings.ColumnRenderOptionModalInfoTextTemplateLabel,
        description: strings.ColumnRenderOptionModalInfoTextTemplateDescription,
        placeholder: ModalColumn.defaultProps.infoTextTemplate,
        value: dataTypeProperties.infoTextTemplate,
        multiline: true,
        disabled: !dataTypeProperties.showInfoText,
        onChange: (_, value) => onChange('infoTextTemplate', value)
      }
    } as IColumnDataTypePropertyField<ITextFieldProps>
  ]
)
