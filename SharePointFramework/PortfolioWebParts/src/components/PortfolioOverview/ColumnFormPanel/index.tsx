import { Panel, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { ColumnRenderField } from './ColumnRenderField'
import { ColumnVisibilityField } from './ColumnVisibilityField'
import { useColumnFormPanel } from './useColumnFormPanel'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import { ColumnSearchPropertyField, FormFieldContainer, UserMessage } from 'pp365-shared-library'

export const ColumnFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const {
    onSave,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    isEditing,
    isSaveDisabled,
    onDeleteColumn,
    findMatchingSearchProperty,
    columnMessages
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
        />
      )}
      isFooterAtBottom={true}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <FormFieldContainer>
        <TextField
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
          type='number'
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
          onBlur={findMatchingSearchProperty}
        />
      </FormFieldContainer>
      <ColumnSearchPropertyField
        label={strings.SearchPropertyLabel}
        description={strings.SearchPropertyDescription}
        placeholder={strings.SearchPropertyPlaceholder}
        value={column.get('fieldName')}
        onChange={(value) => setColumn('fieldName', value)}
        disabled={isEditing}
        managedProperties={context.state.managedProperties}
      >
        {columnMessages.get('fieldName') && (
          <UserMessage
            styles={{ root: { margin: '8px 0' } }}
            text={columnMessages.get('fieldName')}
          />
        )}
      </ColumnSearchPropertyField>
      <FormFieldContainer>
        <TextField
          label={strings.DisplayNameLabel}
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
          value={column.get('minWidth').toString()}
          onChange={(_, value) => setColumn('minWidth', parseInt(value))}
        />
      </FormFieldContainer>
      <ColumnRenderField
        defaultSelectedKey={column.get('dataType')}
        onChange={(renderAs) => setColumnData('renderAs', renderAs)}
        dataTypeProperties={column.get('data')?.dataTypeProperties ?? {}}
        onDataTypePropertiesChange={(dataTypeProperties) =>
          setColumnData('dataTypeProperties', dataTypeProperties)
        }
      />
      <ColumnVisibilityField
        defaultSelectedKeys={column.get('data')?.visibility}
        onChange={(visibility) => setColumnData('visibility', visibility)}
      />
      <FormFieldContainer description={strings.IsRefinableDescription}>
        <Toggle
          label={strings.IsRefinableLabel}
          defaultChecked={column.get('isRefinable')}
          onChange={(_, checked) => setColumn('isRefinable', checked)}
        />
      </FormFieldContainer>
      <FormFieldContainer description={strings.IsGroupableDescription}>
        <Toggle
          label={strings.IsGroupableLabel}
          defaultChecked={column.get('data')?.isGroupable}
          onChange={(_, checked) => setColumnData('isGroupable', checked)}
        />
      </FormFieldContainer>
    </Panel>
  )
}

export * from './useColumnFormPanel'
