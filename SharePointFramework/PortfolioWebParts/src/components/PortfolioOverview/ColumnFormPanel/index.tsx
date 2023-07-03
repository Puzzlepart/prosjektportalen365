import { Panel, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { ColumnRenderField } from './ColumnRenderField'
import { ColumnVisibilityField } from './ColumnVisibilityField'
import { useColumnFormPanel } from './useColumnFormPanel'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import { FormFieldContainer } from 'pp365-shared-library'

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
    onDeleteColumn
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
          label={strings.SearchPropertyLabel}
          description={strings.SearchPropertyDescription}
          required={true}
          value={column.get('fieldName')}
          disabled={isEditing}
          onChange={(_, value) => setColumn('fieldName', value)}
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
      <ColumnRenderField
        defaultSelectedKey={column.get('dataType')}
        onChange={(renderAs) => setColumnData('renderAs', renderAs)}
      />
      <ColumnVisibilityField
        defaultSelectedKeys={column.get('data')?.visibility}
        onChange={(visibility) => setColumnData('visibility', visibility)}
      />
    </Panel>
  )
}

export * from './useColumnFormPanel'
