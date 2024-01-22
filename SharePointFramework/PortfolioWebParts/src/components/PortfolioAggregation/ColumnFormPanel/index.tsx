import { Panel } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import { ColumnSearchPropertyField, FieldContainer, customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ColumnDataTypeField } from '../../List/ItemColumn/ColumnDataTypeField'
import { usePortfolioAggregationContext } from '../context'
import styles from './ColumnFormPanel.module.scss'
import { ColumnFormPanelFooter } from './ColumnFormPanelFooter'
import { useColumnFormPanel } from './useColumnFormPanel'
import { FluentProvider, IdPrefixProvider, Input, Switch, useId } from '@fluentui/react-components'

export const ColumnFormPanel: FC = () => {
  const fluentProviderId = useId('fp-column-form-panel')
  const context = usePortfolioAggregationContext()
  const {
    onSave,
    isSaveDisabled,
    onDeleteColumn,
    isDeleteDisabled,
    onDismiss,
    column,
    setColumn,
    setColumnData,
    persistRenderGlobally,
    setPersistRenderGlobally,
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
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} className={styles.content}>
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.SortOrderLabel}
            description={strings.SortOrderDescription}
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
            />
          </FieldContainer>
          <FieldContainer
            iconName='DatabaseSearch'
            label={strings.SearchPropertyLabel}
            description={strings.SearchPropertyDescription}
            required={true}
          >
            <ColumnSearchPropertyField
              placeholder={strings.SearchPropertyPlaceholder}
              value={column.get('fieldName')}
              onChange={(value) => setColumn('fieldName', value)}
              disabled={isEditing}
            />
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
              max={column.get('maxWidth') ?? 400}
              step={2}
              onChange={(_, data) => setColumn('minWidth', parseInt(data.value))}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <FieldContainer
            iconName='NumberSymbolSquare'
            label={strings.MaxWidthLabel}
            description={strings.MaxWidthDescription}
          >
            <Input
              value={column.get('maxWidth')?.toString()}
              type='number'
              defaultValue='120'
              min={column.get('minWidth') ?? 40}
              max={400}
              step={2}
              onChange={(_, data) => setColumn('maxWidth', parseInt(data.value))}
              placeholder={strings.Placeholder.TextField}
            />
          </FieldContainer>
          <ColumnDataTypeField
            label={strings.ColumnRenderLabel}
            description={strings.ColumnRenderDescription}
            defaultSelectedKey={column.get('dataType')}
            onChange={(renderAs) => setColumnData('renderAs', renderAs)}
            dataTypeProperties={column.get('data')?.dataTypeProperties ?? {}}
            onDataTypePropertiesChange={(dataTypeProperties) =>
              setColumnData('dataTypeProperties', dataTypeProperties)
            }
            persistRenderGloballyField={{
              defaultChecked: persistRenderGlobally || !isEditing,
              onChange: (_, data) => setPersistRenderGlobally(!!data.checked),
              hidden: !isEditing,
              disabled: column.get('fieldName') === 'Title'
            }}
          />
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
          <FieldContainer
            iconName='GroupList'
            label={strings.ColumnCategoryLabel}
            description={strings.ColumnCategoryDescription}
          >
            <Input value={context.props.dataSourceCategory} disabled={true} />
          </FieldContainer>
        </FluentProvider>
      </IdPrefixProvider>
    </Panel>
  )
}

export * from './useColumnFormPanel'
