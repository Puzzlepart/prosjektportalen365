import { Panel } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { useColumnFormPanel } from './useColumnFormPanel'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import { ColumnSearchPropertyField, FieldContainer, UserMessage } from 'pp365-shared-library'
import { ColumnDataTypeField } from '../../List/ItemColumn/ColumnDataTypeField'
import {
  Combobox,
  Option,
  FluentProvider,
  Input,
  Switch,
  useId,
  webLightTheme
} from '@fluentui/react-components'
import _ from 'lodash'
import { visibilityOptions } from './types'

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
      <FluentProvider id={fluentProviderId} theme={webLightTheme} className={styles.content}>
        <FieldContainer
          iconName='NumberSymbolSquare'
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
        >
          <Input
            value={column.get('sortOrder')?.toString()}
            type='number'
            defaultValue='100'
            min={40}
            max={400}
            step={2}
            disabled={isEditing}
            onChange={(_, data) => setColumn('sortOrder', parseInt(data.value))}
            placeholder={strings.Placeholder.TextField}
          />
        </FieldContainer>
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
        <FieldContainer
          iconName='DatabaseSearch'
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
        <FieldContainer
          iconName='TextNumberFormat'
          label={strings.DisplayNameLabel}
          description={strings.DisplayNameDescription}
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
            value={column.get('minWidth')?.toString()}
            type='number'
            defaultValue='80'
            min={40}
            max={400}
            step={2}
            onChange={(_, data) => setColumn('minWidth', parseInt(data.value))}
            placeholder={strings.Placeholder.TextField}
          />
        </FieldContainer>
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
            value={column.get('data')?.visibility ? column.get('data')?.visibility.join(', ') : ''}
            defaultSelectedOptions={
              column.get('data')?.visibility ? column.get('data')?.visibility : []
            }
            multiselect
            placeholder={strings.Placeholder.MultiChoiceField}
            onOptionSelect={(e, data) => {
              if (!_.isEmpty(data.selectedOptions)) {
                setColumnData('visibility', data.selectedOptions)
              } else {
                setColumnData('visibility', [''])
              }
            }}
          >
            {visibilityOptions.map((choice) => (
              <Option key={choice.text} value={choice.value}>
                {choice.text}
              </Option>
            ))}
          </Combobox>
        </FieldContainer>
        <div className={styles.groupedFields}>
          <FieldContainer
            iconName='Filter'
            label={strings.IsRefinableLabel}
            description={strings.IsRefinableDescription}
          >
            <Switch
              defaultChecked={column.get('isRefinable')}
              onChange={(_, data) => setColumn('isRefinable', data.checked)}
            />
          </FieldContainer>
          <FieldContainer
            iconName='GroupList'
            label={strings.IsGroupableLabel}
            description={strings.IsGroupableDescription}
          >
            <Switch
              defaultChecked={column.get('data').isGroupable}
              onChange={(_, data) => setColumn('isGroupable', data.checked)}
            />
          </FieldContainer>
        </div>
      </FluentProvider>
    </Panel>
  )
}

export * from './useColumnFormPanel'
