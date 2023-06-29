import { ActionButton, Checkbox, DefaultButton, Panel, PrimaryButton } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggingStyle,
  Droppable,
  NotDraggingStyle
} from 'react-beautiful-dnd'
import { TOGGLE_SHOW_HIDE_COLUMN_PANEL } from '../reducer'
import styles from './EditViewColumnsPanel.module.scss'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { PortfolioAggregationContext } from '../context'
import _ from 'lodash'

const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})

export const EditViewColumnsPanel: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const { state, onDismiss, onDragEnd, selectedColumns, onChange, onSave, isChanged, dispatch,moveColumn } =
    useEditViewColumnsPanel()

  return (
    <Panel
      isOpen={state.showHideColumnPanel.isOpen}
      headerText={strings.EditViewColumnsPanelHeaderText}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <p>{strings.ShowHideColumnsDescription}</p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId='droppable'>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {selectedColumns.map((col, idx) => (
                <Draggable key={col.name} draggableId={col.name} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      className={styles.columnItem}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={
                        getItemStyle(snapshot.isDragging, provided.draggableProps.style) as any
                      }
                    >
                      <Checkbox
                        label={col.name}
                        checked={_.some(
                          context.state.fltColumns,
                          (c) => c.fieldName === col.fieldName
                        )}
                        onChange={(_event, checked) => onChange(col, checked)}
                      />
                      <div className={styles.columnItemActions}>
                        <ActionButton iconProps={{ iconName: 'ChevronUp' }} className={styles.columnItemButton} onClick={() => moveColumn(col, -1)} />
                        <ActionButton iconProps={{ iconName: 'ChevronDown' }} className={styles.columnItemButton} onClick={() => moveColumn(col, 1)} />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
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
