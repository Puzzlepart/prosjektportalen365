import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { Panel } from 'office-ui-fabric-react/lib/Panel'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useState } from 'react'
import styles from './AddColumnPanel.module.scss'
import { IAddColumnPanelProps } from './types'

export const addColumn = (onColumnClick: () => void) => ({
  key: '',
  fieldName: '',
  name: strings.AddColumnText,
  iconName: 'CalculatorAddition',
  iconClassName: styles.addColumnIcon,
  minWidth: 150,
  onColumnClick,
})

export const AddColumnPanel = (props: IAddColumnPanelProps) => {
  const [column, setColumn] = useState<IColumn>({
    key: null,
    fieldName: '',
    name: '',
    minWidth: 100,
    maxWidth: 300,
  })

  const onSave = () => {
    props.onAddColumn({ ...column, key: column.fieldName })
    props.onDismiss()
  }

  return (
    <Panel
      isOpen={props.isOpen}
      headerText={strings.NewColumnHeaderText}
      className={styles.root}>
      <div className={styles.field}>
        <TextField
          label={strings.SearchPropertyLabel}
          value={column.fieldName}
          onChange={(_, value) => setColumn({
            ...column,
            fieldName: value
          })} />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.DisplayNameLabel}
          value={column.name}
          onChange={(_, value) => setColumn({
            ...column,
            name: value
          })} />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.MinWidthLabel}
          type='number'
          value={column.minWidth.toString()}
          onChange={(_, value) => setColumn({
            ...column,
            minWidth: parseInt(value)
          })} />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.MaxWidthLabel}
          type='number'
          value={column.maxWidth.toString()}
          onChange={(_, value) => setColumn({
            ...column,
            maxWidth: parseInt(value)
          })} />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsMultilineLabel}
          defaultChecked={column.isMultiline}
          onChange={(_, checked) => setColumn({
            ...column,
            isMultiline: checked
          })} />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsResizablehLabel}
          defaultChecked={column.isResizable}
          onChange={(_, checked) => setColumn({
            ...column,
            isResizable: checked
          })} />
      </div>
      <div style={{ marginTop: 12 }} >
        <PrimaryButton text={strings.SaveButtonLabel} onClick={onSave} />
        <DefaultButton
          text={strings.CloseButtonLabel}
          style={{ marginLeft: 4 }}
          onClick={() => props.onDismiss()} />
      </div>
    </Panel>
  )
}

export * from './types'