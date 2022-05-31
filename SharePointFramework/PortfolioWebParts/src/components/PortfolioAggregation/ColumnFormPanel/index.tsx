import { AnyAction } from '@reduxjs/toolkit'
import { IProjectContentColumn } from 'interfaces/IProjectContentColumn'
import { Dropdown } from 'office-ui-fabric-react'
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { Panel } from 'office-ui-fabric-react/lib/Panel'
import { TextField } from 'office-ui-fabric-react/lib/TextField'
import { Toggle } from 'office-ui-fabric-react/lib/Toggle'
import * as strings from 'PortfolioWebPartsStrings'
import React, { Dispatch, useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { ADD_COLUMN, REMOVE_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import styles from './ColumnFormPanel.module.scss'
import { renderOptions } from './renderOptions'

export const addColumn = (dispatch: Dispatch<AnyAction>) => ({
  key: '',
  fieldName: '',
  name: strings.AddColumnText,
  iconName: 'CalculatorAddition',
  iconClassName: styles.addColumnIcon,
  minWidth: 150,
  onColumnClick: () => dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true }))
}) // TODO: Add 'Vis/Skjul kolonner' option as a dropdown element if there is time

const initialColumn = {
  key: null,
  fieldName: '',
  internalname: '',
  name: '',
  minWidth: 100,
  maxWidth: 150,
  data: {
    renderAs: 'text'
  }
}

export const ColumnFormPanel = () => {
  const { state, dispatch } = useContext(PortfolioAggregationContext)
  const [column, setColumn] = useState<IProjectContentColumn>({
    ...initialColumn,
    ...(state.editColumn || {})
  })

  useEffect(() => {
    if (state.editColumn) {
      setColumn({
        minWidth: 100,
        maxWidth: 150,
        data: {
          renderAs: 'text'
        },
        ...state.editColumn
      })
    }
  }, [state.editColumn])

  const onSave = () => {
    setColumn(initialColumn)
    dispatch(ADD_COLUMN({ column: { ...column, key: column.fieldName } }))
  }

  const onDismiss = () => {
    setColumn(initialColumn)
    dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
  }

  return (
    <Panel
      isOpen={state.addColumnPanel.isOpen}
      headerText={state.editColumn ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}>
      <div className={styles.field}>
        <TextField
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
          type={'number'}
          value={(column.sortOrder && column.sortOrder.toString()) || '100'}
          disabled={!!state.editColumn}
          onChange={(_, value) =>
            setColumn({
              ...column,
              sortOrder: parseInt(value)
            })
          }
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.SearchPropertyLabel}
          description={strings.SearchPropertyDescription}
          required={true}
          value={column.fieldName}
          disabled={!!state.editColumn}
          onChange={(_, value) =>
            setColumn({
              ...column,
              fieldName: value
            })
          }
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.InternalNameLabel}
          description={strings.InternalNameDescription}
          required={true}
          value={column.internalName}
          disabled={!!state.editColumn}
          onChange={(_, value) =>
            setColumn({
              ...column,
              internalName: value
            })
          }
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.DisplayNameLabel}
          required={true}
          value={column.name}
          onChange={(_, value) =>
            setColumn({
              ...column,
              name: value
            })
          }
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.MinWidthLabel}
          type='number'
          value={column.minWidth.toString()}
          onChange={(_, value) =>
            setColumn({
              ...column,
              minWidth: parseInt(value)
            })
          }
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.MaxWidthLabel}
          type='number'
          value={column.maxWidth.toString()}
          onChange={(_, value) =>
            setColumn({
              ...column,
              maxWidth: parseInt(value)
            })
          }
        />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsMultilineLabel}
          defaultChecked={column.isMultiline}
          onChange={(_, checked) =>
            setColumn({
              ...column,
              isMultiline: checked
            })
          }
        />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsResizableLabel}
          defaultChecked={column.isResizable}
          onChange={(_, checked) =>
            setColumn({
              ...column,
              isResizable: checked
            })
          }
        />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsGroupableLabel}
          defaultChecked={column.data?.isGroupable}
          onChange={(_, checked) =>
            setColumn({
              ...column,
              data: {
                ...column.data,
                isGroupable: checked
              }
            })
          }
        />
      </div>
      <div className={styles.field}>
        <Dropdown
          label={strings.ColumnRenderLabel}
          options={renderOptions}
          defaultSelectedKey={column.data?.renderAs || 'text'}
          onChange={(_, opt) =>
            setColumn({
              ...column,
              data: {
                ...column.data,
                renderAs: opt.key
              }
            })
          }
        />
      </div>
      <div className={styles.footer}>
        <PrimaryButton
          text={strings.SaveButtonLabel}
          onClick={onSave}
          disabled={column.fieldName.length < 2 || column.name.length < 2}
        />
        <DefaultButton
          text={strings.CloseButtonLabel}
          style={{ marginLeft: 4 }}
          onClick={() => {
            dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
            setColumn({
              ...column,
              name: '',
              fieldName: ''
            })
          }}
        />
        {state.editColumn && (
          <DefaultButton
            text={strings.RemoveButtonLabel}
            style={{ marginLeft: 4 }}
            onClick={() => {
              dispatch(REMOVE_COLUMN())
            }}
          />
        )}
      </div>
    </Panel>
  )
}
