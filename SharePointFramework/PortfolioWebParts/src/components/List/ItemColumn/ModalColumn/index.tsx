import { Checkbox, DetailsList, Link, Modal, SelectionMode, TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pp365-shared-library'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponentRegistry } from '../registry'
import { ColumnRenderComponent } from '../types'
import { Header } from './Header'
import styles from './ModalColumn.module.scss'
import { columns } from './columns'
import { IModalColumnProps } from './types'
import { useModalColumn } from './useModalColumn'

/**
 * A column render component that displays a link in the cell. When the link is clicked, a modal dialog is displayed
 * that shows a list of items with columns. The columns can be customized using the `columns` prop. The link text can
 * be customized using the `linkText` prop. The modal dialog can be customized using various props such as `isDarkOverlay`,
 * `isBlocking`, and `containerClassName`. The component also supports showing an information text below the list of items
 * using the `infoTextTemplate` prop. The information text can be customized using placeholders such as `{{Title}}` and
 * `{{Count}}`. The `{{Title}}` placeholder will be replaced with the title of the column.
 *
 * @param props - The props for the component.
 * @param props.columns - The columns to display in the modal dialog.
 * @param props.linkText - The text to display in the link.
 * @param props.isDarkOverlay - Whether to use a dark overlay for the modal dialog.
 * @param props.isBlocking - Whether to block the UI when the modal dialog is displayed.
 * @param props.selectionMode - The selection mode for the list of items.
 * @param props.header - The header to display in the modal dialog.
 * @param props.infoTextTemplate - The template for the information text to display below the list of items.
 * @param props.showInfoText - Whether to show the information text.
 * @param props.emptyListText - The text to display when the list of items is empty.
 */
export const ModalColumn: ColumnRenderComponent<IModalColumnProps> = (props) => {
  const { isOpen, setIsOpen, infoText, items, shouldRenderList, onRenderItemColumn } =
    useModalColumn(props)

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
        <Header {...props} />
        {infoText && <p className={styles.infoText}>{infoText}</p>}
        {shouldRenderList ? (
          <DetailsList
            items={items}
            columns={props.columns}
            onRenderItemColumn={onRenderItemColumn}
            selectionMode={props.selectionMode}
          />
        ) : (
          <UserMessage text={props.emptyListText} className={styles.emptyListText} />
        )}
      </Modal>
    </div>
  )
}

ModalColumn.defaultProps = {
  linkText: strings.ShowAllMeasurementsLinkText,
  isDarkOverlay: true,
  columns,
  selectionMode: SelectionMode.none
}
ModalColumn.key = 'modal'
ModalColumn.id = 'Modal'
ModalColumn.displayName = strings.ColumnRenderOptionModal
ModalColumn.iconName = 'WindowEdit'
ModalColumn.isDisabled = true
ColumnRenderComponentRegistry.register(
  ModalColumn,
  (onChange, dataTypeProperties: Record<string, any>) => [
    ColumnDataTypePropertyField(TextField, {
      label: strings.ColumnRenderOptionModalLinkTextLabel,
      placeholder: ModalColumn.defaultProps.linkText,
      value: dataTypeProperties['linkText'],
      onChange: (_, value) => onChange('linkText', value)
    }),
    ColumnDataTypePropertyField(Checkbox, {
      label: strings.ColumnRenderOptionModalShowInfoTextLabel,
      defaultChecked: ModalColumn.defaultProps.showInfoText,
      checked: dataTypeProperties.showInfoText,
      onChange: (_, value) => onChange('showInfoText', value)
    }),
    ColumnDataTypePropertyField(TextField, {
      label: strings.ColumnRenderOptionModalInfoTextTemplateLabel,
      description: strings.ColumnRenderOptionModalInfoTextTemplateDescription,
      placeholder: ModalColumn.defaultProps.infoTextTemplate,
      value: dataTypeProperties.infoTextTemplate,
      multiline: true,
      disabled: !dataTypeProperties.showInfoText,
      onChange: (_, value) => onChange('infoTextTemplate', value)
    })
  ]
)
