import {
  Checkbox,
  DefaultButton,
  Dropdown,
  Panel,
  PrimaryButton,
  TextField,
  Toggle
} from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { DELETE_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import styles from './ColumnFormPanel.module.scss'
import { renderOptions } from './renderOptions'
import { useColumnFormPanel } from './useColumnFormPanel'
import { ColumnSearchPropertyField, FormFieldContainer } from 'pp365-shared-library'

export const ColumnFormPanel: FC = () => {
  const {
    state,
    props,
    dispatch,
    onSave,
    onDismiss,
    column,
    setColumn,
    persistRenderAs,
    setPersistRenderAs
  } = useColumnFormPanel()

  return (
    <Panel
      isOpen={state.isAddColumnPanelOpen}
      headerText={state.editColumn ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <FormFieldContainer>
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
      </FormFieldContainer>
      <FormFieldContainer>
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
      </FormFieldContainer>
      <ColumnSearchPropertyField
        label={strings.SearchPropertyLabel}
        description={strings.SearchPropertyDescription}
        required={true}
        value={column.fieldName}
        disabled={!!state.editColumn}
        onChange={(value) =>
          setColumn({
            ...column,
            fieldName: value
          })
        }
      />
      <FormFieldContainer>
        <TextField
          label={strings.DisplayNameLabel}
          description={strings.DisplayNameDescription}
          required={true}
          value={column.name}
          onChange={(_, value) =>
            setColumn({
              ...column,
              name: value
            })
          }
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.MinWidthLabel}
          description={strings.MinWidthDescription}
          type='number'
          value={column.minWidth.toString()}
          max={column.maxWidth}
          onChange={(_, value) =>
            setColumn({
              ...column,
              minWidth: parseInt(value)
            })
          }
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.MaxWidthLabel}
          description={strings.MaxWidthDescription}
          type='number'
          value={column.maxWidth.toString()}
          min={column.minWidth ?? 0}
          onChange={(_, value) =>
            setColumn({
              ...column,
              maxWidth: parseInt(value)
            })
          }
        />
      </FormFieldContainer>
      <FormFieldContainer>
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
      </FormFieldContainer>
      <FormFieldContainer>
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
      </FormFieldContainer>
      <FormFieldContainer>
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
      </FormFieldContainer>
      <FormFieldContainer description={strings.ColumnRenderDescription}>
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
        {state.editColumn && (
          <Checkbox
            label={strings.ColumnRenderPersistGloballyLabel}
            defaultChecked={persistRenderAs}
            onChange={(_, checked) => setPersistRenderAs(checked)}
            styles={{ root: { margin: '10px 0 15px 0' } }}
          />
        )}
      </FormFieldContainer>
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
        {state.editColumn && state.editColumn.fieldName !== 'Title' && (
          <DefaultButton
            text={strings.DeleteButtonLabel}
            style={{ marginLeft: 4 }}
            onClick={async () => {
              await Promise.resolve(
                props.dataAdapter
                  .deleteProjectContentColumn(state.editColumn)
                  .then(() => {
                    dispatch(DELETE_COLUMN())
                  })
                  .catch((error) => (state.error = error))
              )
            }}
          />
        )}
      </div>
    </Panel>
  )
}

export * from './useColumnFormPanel'
