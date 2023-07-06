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
import styles from './ItemModal.module.scss'
import { columns } from './columns'
import { IModalColumnProps } from './types'
import { useInfoText } from './useInfoText'

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
ModalColumn.getDataTypeOption = () => ({
  key: ModalColumn.key,
  id: ModalColumn.id,
  text: ModalColumn.displayName,
  disabled: true,
  data: {
    iconProps: { iconName: ModalColumn.iconName },
    getDataTypeProperties: (onChange, dataTypeProperties: Record<string, any>) => [
      [
        TextField,
        {
          label: strings.ColumnRenderOptionModalLinkTextLabel,
          placeholder: ModalColumn.defaultProps.linkText,
          value: dataTypeProperties['linkText'],
          onChange: (_, value) => onChange('linkText', value)
        } as ITextFieldProps
      ],
      [
        Checkbox,
        {
          label: strings.ColumnRenderOptionModalShowInfoTextLabel,
          defaultChecked: ModalColumn.defaultProps.showInfoText,
          checked: dataTypeProperties.showInfoText,
          onChange: (_, value) => onChange('showInfoText', value)
        } as ICheckboxProps
      ],
      [
        TextField,
        {
          label: strings.ColumnRenderOptionModalInfoTextTemplateLabel,
          description: strings.ColumnRenderOptionModalInfoTextTemplateDescription,
          placeholder: ModalColumn.defaultProps.infoTextTemplate,
          value: dataTypeProperties.infoTextTemplate,
          multiline: true,
          disabled: !dataTypeProperties.showInfoText,
          onChange: (_, value) => onChange('infoTextTemplate', value)
        } as ITextFieldProps
      ]
    ]
  }
})
