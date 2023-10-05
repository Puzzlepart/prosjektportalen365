import { Panel, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { ColumnVisibilityField } from './ColumnVisibilityField'
import { useColumnFormPanel } from './useColumnFormPanel'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import {
  ColumnSearchPropertyField,
  FieldContainer,
  FormFieldContainer,
  UserMessage
} from 'pp365-shared-library'
import { ColumnDataTypeField } from '../../List/ItemColumn/ColumnDataTypeField'
import { FluentProvider, Input, useId, webLightTheme } from '@fluentui/react-components'

export const ColumnFormPanel: FC = () => {
  const fluentProviderId = useId('fluent-provider')
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
      styles={{ commands: { paddingBottom: 12 } }}
    >
      <FluentProvider id={fluentProviderId} theme={webLightTheme}>
        <div className={styles.content}>
        <FormFieldContainer>
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.SortOrderLabel}
            description={strings.SortOrderLabel}
          >
            <Input
              value={column.get('sortOrder')}
              type='number'
              defaultValue='100'
              min={40}
              max={400}
              step={2}
              disabled={isEditing}
              onChange={(_, data) => setColumn('sortOrder', parseInt(data.value))}
              placeholder={strings.Placeholder.TextField}
              onBlur={findMatchingSearchProperty}
            />
          </FieldContainer>
        </FormFieldContainer>
        <FormFieldContainer>
          <FieldContainer
            iconName='TextNumberFormat'
            label={strings.InternalNameLabel}
            description={strings.InternalNameDescription}
            required={true}
          >
            <Input
              value={column.get('internalName')}
              disabled={isEditing}
              onChange={(_, data) => setColumn('internalName', data.value)}
              placeholder={strings.Placeholder.TextField}
              onBlur={findMatchingSearchProperty}
            />
          </FieldContainer>
        </FormFieldContainer>
        <FormFieldContainer>
          <FieldContainer
            iconName='TextNumberFormat'
            label={strings.SearchPropertyLabel}
            description={strings.SearchPropertyDescription}
            required={true}
          >
            <ColumnSearchPropertyField
              styles={{ field: styles.field, root: { padding: 0 } }}
              placeholder={strings.SearchPropertyPlaceholder}
              value={column.get('fieldName')}
              onChange={(value) => setColumn('fieldName', value)}
              disabled={isEditing}
              managedProperties={context.state.managedProperties}
            >
              {columnMessages.get('fieldName') && (
                <UserMessage style={{ margin: '8px 0' }} text={columnMessages.get('fieldName')} />
              )}
            </ColumnSearchPropertyField>
          </FieldContainer>
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
        <ColumnDataTypeField
          description={strings.PortfolioOverviewColumnRenderDescription}
          defaultSelectedKey={column.get('dataType')}
          onChange={(renderAs) => setColumnData('renderAs', renderAs)}
          dataTypeProperties={column.get('data')?.dataTypeProperties ?? {}}
          onDataTypePropertiesChange={(properties) =>
            setColumnData('dataTypeProperties', properties)
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
          </div>
      </FluentProvider>
    </Panel>
  )
}

export * from './useColumnFormPanel'
