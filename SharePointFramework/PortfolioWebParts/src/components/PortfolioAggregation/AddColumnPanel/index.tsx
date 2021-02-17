import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { Panel } from 'office-ui-fabric-react/lib/Panel'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import React, { useState } from 'react'
import styles from './AddColumnPanel.module.scss'
import { IAddColumnPanelProps } from './types'

export const addColumn = (onColumnClick: () => void) => ({
  key: '',
  fieldName: '',
  name: 'Legg til kolonne',
  iconName: 'CalculatorAddition',
  iconClassName: styles.addColumnIcon,
  minWidth: 100,
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
  }

  return (
    <Panel
      isOpen={props.isOpen}
      headerText='Ny kolonne'
      className={styles.root}>
      <div className={styles.field}>
        <TextField
          label='Søkeegenskap'
          value={column.fieldName}
          onChange={(_, value) => setColumn({
            ...column,
            fieldName: value
          })} />
      </div>
      <div className={styles.field}>
        <TextField
          label='Visningsnavn'
          value={column.name}
          onChange={(_, value) => setColumn({
            ...column,
            name: value
          })} />
      </div>
      <div className={styles.field}>
        <TextField
          label='Minium bredde'
          type='number'
          value={column.minWidth.toString()}
          onChange={(_, value) => setColumn({
            ...column,
            minWidth: parseInt(value)
          })} />
      </div>
      <div className={styles.field}>
        <TextField
          label='Maks bredde'
          type='number'
          value={column.maxWidth.toString()}
          onChange={(_, value) => setColumn({
            ...column,
            maxWidth: parseInt(value)
          })} />
      </div>
      <div style={{ marginTop: 12 }} >
        <PrimaryButton text='Lagre' onClick={onSave} />
        <DefaultButton
          text='Lukk'
          style={{ marginLeft: 4 }}
          onClick={() => props.onDismiss()} />
      </div>
    </Panel>
  )
}

export * from './types'