import { Checkbox, Panel, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ColumnSearchPropertyField, FormFieldContainer } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ColumnRenderField } from '../../../components/ColumnRenderField'
import { PortfolioAggregationContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import { useColumnFormPanel } from './useColumnFormPanel'

export const ColumnFormPanel: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const {
    onSave,
    isSaveDisabled,
    onDeleteColumn,
    isDeleteDisabled,
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
      onRenderFooterContent={() => (
        <ColumnFormPanelFooter
          onSave={onSave}
          onDeleteColumn={onDeleteColumn}
          isEditing={isEditing}
          isSaveDisabled={isSaveDisabled}
          isDeleteDisabled={isDeleteDisabled}
        />
      )}
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
          disabled={!isEditing || column.get('fieldName') === 'Title'}
        />
      </ColumnRenderField>
    </Panel>
  )
}

export * from './useColumnFormPanel'
