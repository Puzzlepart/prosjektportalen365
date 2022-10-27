import { SelectionMode, Checkbox, SearchBox } from '@fluentui/react'
import { uniqBy } from '@microsoft/sp-lodash-subset'
import strings from 'ProgramWebPartsStrings'
import React, { FormEvent, FC, useContext, useEffect, useMemo, useState, ChangeEvent } from 'react'
import { ProgramAdministrationContext } from '../context'
import styles from './ProjectTable.module.scss'
import { IListField, IProjectTableProps } from './types'

export const ProjectTable: FC<IProjectTableProps> = (props) => {
  const context = useContext(ProgramAdministrationContext)
  const [items, setItems] = useState<any[]>([])
  const [selection, setSelection] = useState<any[]>([])

  useEffect(() => setItems(props.items), [props.items])
  useEffect(() => props.onSelectionChanged(selection), [selection])

  const handleItemClicked = (item: any, selecting: boolean) => {
    if (props.selectionMode === SelectionMode.none) return
    let newSelection: any[] = null
    if (selecting) {
      switch (props.selectionMode) {
        case SelectionMode.single: {
          newSelection = [item]
          break
        }
        case SelectionMode.multiple: {
          newSelection = [...selection, item]
          break
        }
      }
    } else {
      newSelection = [...selection.filter((selectedItem: any): boolean => selectedItem !== item)]
    }
    if (newSelection) {
      setSelection(newSelection)
    }
  }

  const handleHeaderCheckboxClicked = (selecting: boolean) => {
    if (props.selectionMode === SelectionMode.none) return
    let newSelection: any[] = null
    if (selecting) {
      switch (props.selectionMode) {
        case SelectionMode.multiple: {
          newSelection = [...props.items]
          break
        }
      }
    } else {
      newSelection = []
    }
    if (newSelection) {
      setSelection(newSelection)
    }
  }

  const handleFilterChanged = (_: ChangeEvent<HTMLInputElement>, filter: string) => {
    const filtered: any[] = props.items.filter((item: any): boolean =>
      props.fields
        .map((field: IListField): string => field.fieldName)
        .some(
          (key: string): boolean =>
            key in item && (item[key] + '').toLowerCase().indexOf(filter) >= 0
        )
    )
    setItems(uniqBy([...(selection ?? []), ...filtered], (item) => item.SiteId))
  }

  const renderCheckbox = (checked: boolean, onChange: (checked: boolean) => void) => (
    <Checkbox
      checked={checked}
      disabled={!context.state.userHasManagePermission}
      styles={{
        root: { top: '50%', transform: 'translateY(-50%)' },
        checkbox: { borderRadius: '16px' }
      }}
      onChange={(ev: FormEvent, newChecked: boolean) => {
        onChange(newChecked)
        ev.stopPropagation()
      }}
    />
  )

  const headers = useMemo<JSX.Element[]>(() => {
    const checked: boolean =
      props.items && props.items.every((item): boolean => selection.indexOf(item) >= 0)
    return [
      <li
        key='checkbox'
        className={styles.column}
        onClick={(event) => {
          event.preventDefault()
          handleHeaderCheckboxClicked(!checked)
        }}>
        {renderCheckbox(checked, handleHeaderCheckboxClicked)}
      </li>,
      ...props.fields.map(
        (field: IListField): JSX.Element => (
          <li key={field.key} className={styles.column}>
            <div className={styles.headerText}>{field ? field.text : ''}</div>
          </li>
        )
      )
    ]
  }, [props.fields, props.items, selection])

  const renderListRow = (item: any): JSX.Element[] => {
    const checked: boolean = selection.indexOf(item) >= 0
    return [
      <li
        key='checkbox'
        className={styles.column}
        onClick={(event) => {
          event.preventDefault()
          handleItemClicked(item, !checked)
        }}>
        {renderCheckbox(checked, (newChecked: boolean) => handleItemClicked(item, newChecked))}
      </li>,
      ...props.fields.map((field: IListField, index: number) => (
        <li
          key={field.key}
          className={styles.column}
          onClick={(event) => {
            event.preventDefault()
            handleItemClicked(item, !checked)
          }}>
          {field.onRender ? (
            field.onRender(item, index, field)
          ) : (
            <div>{item[field.fieldName] + ''}</div>
          )}
        </li>
      ))
    ]
  }

  return (
    <div className={styles.root}>
      <SearchBox placeholder={strings.ProgramSearchProjectsText} onChange={handleFilterChanged} />
      <div className={styles.scroll}>
        <ol
          className={styles.list}
          style={{
            gridTemplateColumns: `0fr repeat(${props.fields ? props.fields.length : 0}, auto)`
          }}>
          {props.fields ? (
            <>
              {headers}
              {items ? items.map(renderListRow) : <div />}
            </>
          ) : (
            <div />
          )}
        </ol>
      </div>
    </div>
  )
}
