import { Checkbox, DefaultButton, Panel, PrimaryButton } from '@fluentui/react'
import { IFilterItemProps } from 'components/FilterPanel/FilterItem/types'
import _ from 'lodash'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { SHOW_HIDE_COLUMNS, TOGGLE_SHOW_HIDE_COLUMN_PANEL } from '../reducer'
import styles from './ShowHideColumnPanel.module.scss'

export const ShowHideColumnPanel: FC = () => {
  const { state, props, dispatch } = useContext(PortfolioAggregationContext)
  const [isChanged, setIsChanged] = useState(false)
  const initialSelection = state.columns.map((column) => {
    return {
      id: column['id'],
      name: column.name,
      value: column.fieldName,
      selected: _.some(state.fltColumns, (c) => c.fieldName === column.fieldName)
    }
  })
  const [selectedColumns, setSelectedColumns] = useState<IFilterItemProps[]>(initialSelection)

  useEffect(() => {
    setSelectedColumns(initialSelection)
  }, [state.columns])

  const onSave = async () => {
    const columns = selectedColumns.filter((c) => c.selected)

    const updateItems = {
      GtProjectContentColumnsId: columns.map((c) => c['id'])
    }

    await Promise.resolve(
      props.dataAdapter
        .updateDataSourceItem(updateItems, state.dataSource, true)
        .then(() => {
          dispatch(SHOW_HIDE_COLUMNS({ columns: selectedColumns }))
        })
        .catch((error) => (state.error = error))
    )
  }

  const onDismiss = () => {
    dispatch(TOGGLE_SHOW_HIDE_COLUMN_PANEL({ isOpen: false }))
  }

  const onChange = (col: IFilterItemProps, checked: boolean) => {
    const items = selectedColumns.map((i) => {
      if (i.value === col.value) {
        return { ...i, selected: checked }
      }
      return i
    })
    setSelectedColumns(items)
    setIsChanged(true)
  }

  return (
    <Panel
      isOpen={state.showHideColumnPanel.isOpen}
      headerText={strings.ShowHideColumnsLabel}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}>
      <p>{strings.ShowHideColumnsDescription}</p>
      {selectedColumns.map((col, idx) => {
        return (
          <CheckBox key={idx} {...col} onChanged={(_event, checked) => onChange(col, checked)} />
        )
      })}
      <div className={styles.footer}>
        <PrimaryButton text={strings.SaveButtonLabel} onClick={onSave} disabled={!isChanged} />
        <DefaultButton
          text={strings.CloseButtonLabel}
          style={{ marginLeft: 4 }}
          onClick={() => {
            dispatch(TOGGLE_SHOW_HIDE_COLUMN_PANEL({ isOpen: false }))
          }}
        />
      </div>
    </Panel>
  )
}

export const CheckBox: FC<IFilterItemProps> = (props) => {
  return (
    <>
      <Checkbox
        className={styles.checkbox}
        label={props.name}
        checked={props.selected}
        onChange={props.onChanged}
      />
    </>
  )
}
