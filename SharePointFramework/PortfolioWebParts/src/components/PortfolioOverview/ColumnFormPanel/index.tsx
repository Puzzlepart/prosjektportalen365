import { DefaultButton, Dropdown, Panel, PrimaryButton, TextField, Toggle } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { TOGGLE_COLUMN_FORM_PANEL } from '../reducer'
import styles from './ColumnFormPanel.module.scss'
import { ColumnVisibilityField } from './ColumnVisibilityField'
import { renderAsOptions } from './types'
import { useColumnFormPanel } from './useColumnFormPanel'
import { PortfolioOverviewContext } from '../context'

export const ColumnFormPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const { onSave, onDismiss, column, setColumn } = useColumnFormPanel()

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
          value={(column.sortOrder && column.sortOrder.toString()) || '100'}
          disabled={!!context.state.editColumn}
          onChange={(_, value) => setColumn(column.set({ sortOrder: parseInt(value) }))}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.SearchPropertyLabel}
          description={strings.SearchPropertyDescription}
          required={true}
          value={column.fieldName}
          disabled={!!context.state.editColumn}
          onChange={(_, value) => setColumn(column.set({ fieldName: value }))}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.InternalNameLabel}
          description={strings.InternalNameDescription}
          required={true}
          value={column.internalName}
          disabled={!!context.state.editColumn}
          onChange={(_, value) => setColumn(column.set({ internalName: value }))}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.DisplayNameLabel}
          description={strings.DisplayNameDescription}
          required={true}
          value={column.name}
          onChange={(_, value) => setColumn(column.set({ name: value }))}
        />
      </div>
      <div className={styles.field}>
        <TextField
          label={strings.MinWidthLabel}
          description={strings.MinWidthDescription}
          type='number'
          value={column.minWidth.toString()}
          onChange={(_, value) => setColumn(column.set({ minWidth: parseInt(value) }))}
        />
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsRefinableLabel}
          defaultChecked={column.isRefinable}
          onChange={(_, checked) => setColumn(column.set({ isRefinable: checked }))}
        />
        <div className={styles.fieldDescription}>{strings.IsRefinableDescription}</div>
      </div>
      <div className={styles.field}>
        <Toggle
          label={strings.IsGroupableLabel}
          defaultChecked={column.data?.isGroupable}
          onChange={(_, checked) => setColumn(column.setData({ isGroupable: checked }))}
        />
        <div className={styles.fieldDescription}>{strings.IsGroupableDescription}</div>
      </div>
      <div className={styles.field}>
        <Dropdown
          label={strings.ColumnRenderLabel}
          options={renderAsOptions}
          defaultSelectedKey={column.data?.renderAs || 'text'}
          onChange={(_, opt) => setColumn(column.setData({ renderAs: opt.key as any }))}
        />
        <div className={styles.fieldDescription}>{strings.ColumnRenderDescription}</div>
      </div>
      <ColumnVisibilityField onChange={(visibility) => setColumn(column.setData({ visibility }))} />
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
            context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: false }))
          }}
        />
      </div>
    </Panel>
  )
}

export * from './useColumnFormPanel'
