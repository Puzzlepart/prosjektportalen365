import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { useColumnFormPanel } from './useColumnFormPanel'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import {
  BasePanel,
  ColumnSearchPropertyField,
  FieldContainer,
  UserMessage,
  customLightTheme
} from 'pp365-shared-library'
import { ColumnDataTypeField } from 'pp365-shared-library/lib/components/ItemColumn/ColumnDataTypeField'
import {
  Combobox,
  Option,
  FluentProvider,
  Input,
  Switch,
  IdPrefixProvider
} from '@fluentui/react-components'
import { visibilityOptions } from './types'
import { lockedWhenEditing } from '../../List/lockedWhenEditing'

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
    isDeleteDisabled,
    deleteDisabledReason,
    propertyInUseMessage,
    visibility,
    visibilityText,
    onVisibilityChange,
    isRefinable,
    isGroupable,
    onDeleteColumn,
    findMatchingSearchProperty,
    saveError,
    fluentProviderId
  } = useColumnFormPanel()

  if (!context) return null

  return (
    <BasePanel
      open={context.state.columnForm.isOpen}
      headerText={isEditing ? strings.EditColumnHeaderText : strings.NewColumnHeaderText}
      footer={
        <ColumnFormPanelFooter
          onSave={onSave}
          onDeleteColumn={onDeleteColumn}
          isEditing={isEditing}
          isSaveDisabled={isSaveDisabled}
          saveDisabledReason={propertyInUseMessage}
          isDeleteDisabled={isDeleteDisabled}
          deleteDisabledReason={deleteDisabledReason}
        />
      }
      onClose={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} className={styles.content}>
          {saveError && (
            <UserMessage intent='error' title={strings.ErrorTitle} text={saveError.message} />
          )}
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.SortOrderLabel}
            description={strings.SortOrderDescription}
          >
            <Input
              value={column.get('sortOrder')?.toString() ?? ''}
              type='number'
              min={10}
              max={990}
              step={2}
              onChange={(_, data) => setColumn('sortOrder', parseInt(data.value))}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='TextNumberFormat'
            label={strings.InternalNameLabel}
            description={lockedWhenEditing(strings.InternalNameDescription, isEditing)}
            required={true}
          >
            <Input
              value={column.get('internalName')}
              readOnly={isEditing}
              onChange={(_, data) => setColumn('internalName', data.value)}
              placeholder={strings.Placeholder.TextField}
              onBlur={findMatchingSearchProperty}
            />
          </FieldContainer>
          <FieldContainer
            iconName='DatabaseSearch'
            label={strings.SearchPropertyLabel}
            description={lockedWhenEditing(strings.SearchPropertyDescription, isEditing)}
            required={true}
            validationState={propertyInUseMessage ? 'error' : undefined}
            validationMessage={propertyInUseMessage}
          >
            <ColumnSearchPropertyField
              placeholder={strings.SearchPropertyPlaceholder}
              value={column.get('fieldName')}
              onChange={(value) => setColumn('fieldName', value)}
              readOnly={isEditing}
              // managedProperties={context.state.managedProperties} - AutoComplete doesn't properly when trying to create a new by just typing. Removed for now to use input instead.
            />
            {/* {columnMessages.get('fieldName') && (
              <UserMessage
                title={strings.SearchPropertyFoundTitle}
                text={columnMessages.get('fieldName')}
              />
            )} */}
          </FieldContainer>
          <FieldContainer
            iconName='TextNumberFormat'
            label={strings.DisplayNameLabel}
            description={strings.DisplayNamePortfolioOverviewDescription}
            required={true}
          >
            <Input
              value={column.get('name')}
              onChange={(_, data) => setColumn('name', data.value)}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.MinWidthLabel}
            description={strings.MinWidthDescription}
          >
            <Input
              value={column.get('minWidth')?.toString() ?? ''}
              type='number'
              min={40}
              max={400}
              step={2}
              onChange={(_, data) => setColumn('minWidth', parseInt(data.value))}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          {/* No max width: the overview's list sizes a column by its minimum width alone, so the
              field had no effect. */}
          <ColumnDataTypeField
            label={strings.ColumnRenderLabel}
            description={strings.PortfolioOverviewColumnRenderDescription}
            defaultSelectedKey={column.get('dataType')}
            onChange={(renderAs) => setColumnData('renderAs', renderAs)}
            dataTypeProperties={column.get('data')?.dataTypeProperties ?? {}}
            onDataTypePropertiesChange={(properties) =>
              setColumnData('dataTypeProperties', properties)
            }
          />
          <FieldContainer
            iconName='Eye'
            label={strings.ColumnVisibilityLabel}
            description={strings.ColumnVisibilityDescription}
          >
            <Combobox
              selectedOptions={visibility}
              value={visibilityText}
              multiselect
              placeholder={strings.Placeholder.MultiChoiceField}
              onOptionSelect={onVisibilityChange}
            >
              {visibilityOptions.map((choice) => (
                <Option key={choice.text} value={choice.value}>
                  {choice.text}
                </Option>
              ))}
            </Combobox>
          </FieldContainer>
          <FieldContainer
            iconName='Filter'
            label={strings.IsRefinableLabel}
            description={strings.IsRefinableDescription}
          >
            <Switch
              checked={isRefinable}
              onChange={(_, data) => setColumn('isRefinable', data.checked)}
            />
          </FieldContainer>
          <FieldContainer
            iconName='GroupList'
            label={strings.IsGroupableLabel}
            description={strings.IsGroupableDescription}
          >
            <Switch
              checked={isGroupable}
              onChange={(_, data) => setColumn('isGroupable', data.checked)}
            />
          </FieldContainer>
        </FluentProvider>
      </IdPrefixProvider>
    </BasePanel>
  )
}

export * from './useColumnFormPanel'
