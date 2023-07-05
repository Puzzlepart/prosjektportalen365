import { Checkbox, DefaultButton, Panel, PrimaryButton, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ColumnSearchPropertyField, FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ColumnRenderField } from '../../../components/ColumnRenderField'
import { PortfolioAggregationContext } from '../context'
import { DELETE_COLUMN, TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import styles from './ColumnFormPanel.module.scss'
import { useColumnFormPanel } from './useColumnFormPanel'

export const ColumnFormPanel: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const {
    onSave,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    persistRenderAs,
    setPersistRenderAs,
    isEditing
  } = useColumnFormPanel()

  return (
    <Panel
      isOpen={context.state.columnForm.isOpen}
      headerText={isEditing ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <FormFieldContainer>
        <TextField
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
          type={'number'}
          value={column.get('sortOrder')}
          disabled={isEditing}
          onChange={(_, value) => setColumn('sortOrder', parseInt(value))}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.InternalNameLabel}
          description={strings.InternalNameDescription}
          required={true}
          value={column.get('internalName')}
          disabled={isEditing}
          onChange={(_, value) => setColumn('internalName', value)}
        />
      </FormFieldContainer>
      <ColumnSearchPropertyField
        label={strings.SearchPropertyLabel}
        description={strings.SearchPropertyDescription}
        required={true}
        value={column.get('fieldName')}
        onChange={(value) => setColumn('fieldName', value)}
        disabled={isEditing}
      />
      <FormFieldContainer>
        <TextField
          label={strings.DisplayNameLabel}
          description={strings.DisplayNameDescription}
          required={true}
          value={column.get('name')}
          onChange={(_, value) => setColumn('name', value)}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.MinWidthLabel}
          description={strings.MinWidthDescription}
          type='number'
          value={column.get('minWidth')?.toString()}
          onChange={(_, value) => setColumn('minWidth', parseInt(value))}
          max={column.get('maxWidth')}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextField
          label={strings.MaxWidthLabel}
          description={strings.MaxWidthDescription}
          type='number'
          value={column.get('maxWidth')?.toString()}
          onChange={(_, value) => setColumn('maxWidth', parseInt(value))}
          min={column.get('minWidth') ?? 0}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Toggle
          label={strings.IsResizableLabel}
          checked={column.get('isResizable')}
          onChange={(_, checked) => setColumn('isResizable', checked)}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Toggle
          label={strings.IsGroupableLabel}
          checked={column.get('data').isGroupable}
          onChange={(_, checked) => setColumnData('isGroupable', checked)}
        />
      </FormFieldContainer>
      <ColumnRenderField
        description={strings.ColumnRenderDescription}
        defaultSelectedKey={column.get('dataType')}
        onChange={(renderAs) => setColumnData('renderAs', renderAs)}
        dataTypeProperties={column.get('data')?.dataTypeProperties ?? {}}
        onDataTypePropertiesChange={(dataTypeProperties) =>
          setColumnData('dataTypeProperties', dataTypeProperties)
        }
      >
        <Checkbox
          label={strings.ColumnRenderPersistGloballyLabel}
          defaultChecked={persistRenderAs || !isEditing}
          onChange={(_, checked) => setPersistRenderAs(checked)}
          styles={{ root: { margin: '10px 0 15px 0' } }}
          disabled={!isEditing}
        />
      </ColumnRenderField>
      <div className={styles.footer}>
        <PrimaryButton
          text={strings.SaveButtonLabel}
          onClick={onSave}
          disabled={column.get('fieldName').length < 2 || column.get('name').length < 2}
        />
        <DefaultButton
          text={strings.CloseButtonLabel}
          style={{ marginLeft: 4 }}
          onClick={() => {
            context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
          }}
        />
        {isEditing && context.state.columnForm?.column?.fieldName !== 'Title' && (
          <DefaultButton
            text={strings.DeleteButtonLabel}
            style={{ marginLeft: 4 }}
            onClick={async () => {
              await Promise.resolve(
                context.props.dataAdapter
                  .deleteProjectContentColumn(context.state.columnForm.column)
                  .then(() => {
                    context.dispatch(DELETE_COLUMN())
                  })
              )
            }}
          />
        )}
      </div>
    </Panel>
  )
}

export * from './useColumnFormPanel'
