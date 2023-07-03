import { DefaultButton, Panel, PrimaryButton, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import { TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import styles from './ColumnFormPanel.module.scss'
import { ColumnRenderField } from './ColumnRenderField'
import { ColumnVisibilityField } from './ColumnVisibilityField'
import { useColumnFormPanel } from './useColumnFormPanel'

export const ColumnFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const { onSave, onDismiss, column, setColumn, setColumnData } = useColumnFormPanel()

  return (
    <Panel
      isOpen={context.state.addColumnPanel.isOpen}
      headerText={
        context.state.editColumn ? strings.EditColumnHeaderText : strings.NewColumnHeaderText
      }
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <div className={styles.field}>
        <TextField
          label={strings.SortOrderLabel}
          description={strings.SortOrderLabel}
          type='number'
          value={(column.get('sortOrder') || 100).toString()}
          disabled={!!context.state.editColumn}
          onChange={(_, value) => setColumn('sortOrder', parseInt(value))}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.SearchPropertyLabel}
          description={strings.SearchPropertyDescription}
          required={true}
          value={column.get('fieldName')}
          disabled={!!context.state.editColumn}
          onChange={(_, value) => setColumn('fieldName', value)}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.InternalNameLabel}
          description={strings.InternalNameDescription}
          required={true}
          value={column.get('internalName')}
          disabled={!!context.state.editColumn}
          onChange={(_, value) => setColumn('internalName', value)}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.DisplayNameLabel}
          required={true}
          value={column.get('name')}
          onChange={(_, value) => setColumn('name', value)}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.MinWidthLabel}
          description={strings.MinWidthDescription}
          type='number'
          value={column.get('minWidth').toString()}
          onChange={(_, value) => setColumn('minWidth', parseInt(value))}
        />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsRefinableLabel}
          defaultChecked={column.get('isRefinable')}
          onChange={(_, checked) => setColumn('isRefinable', checked)}
        />
        <div className={styles.fieldDescription}>{strings.IsRefinableDescription}</div>
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsGroupableLabel}
          defaultChecked={column.get('data')?.isGroupable}
          onChange={(_, checked) => setColumnData('isGroupable', checked)}
        />
        <div className={styles.fieldDescription}>{strings.IsGroupableDescription}</div>
      </div>
      <ColumnRenderField
        defaultSelectedKey={column.get('dataType')}
        onChange={(renderAs) => setColumnData('renderAs', renderAs)}
      />
      <ColumnVisibilityField
        defaultSelectedKeys={column.get('data')?.visibility}
        onChange={(visibility) => setColumnData('visibility', visibility)}
      />
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
      </div>
    </Panel>
  )
}

export * from './useColumnFormPanel'
