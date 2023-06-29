import { ActionButton, Checkbox, Panel } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import React, { FC, useContext } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggingStyle,
  Droppable,
  NotDraggingStyle
} from 'react-beautiful-dnd'
import { PortfolioAggregationContext } from '../context'
import styles from './EditViewColumnsPanel.module.scss'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'

const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})

export const EditViewColumnsPanel: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const {
    state,
    onDismiss,
    onDragEnd,
    selectedColumns,
    onChange,
    onSave,
    moveColumn
  } = useEditViewColumnsPanel()

  return (
    <Panel
      isOpen={state.showHideColumnPanel.isOpen}
      onRenderHeader  ={() => (
        <div className={styles.header}>
          <ActionButton text='Bruk' iconProps={{ iconName: 'CheckMark' }} onClick={onSave} />
        </div>
      )}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <h2 className={styles.title}>{strings.EditViewColumnsPanelHeaderText}</h2>
      <p className={styles.helpText}>{strings.ShowEditViewColumnsPanelHelpText}</p>
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
                        <ActionButton
                          iconProps={{ iconName: 'ChevronUp', styles: { root: { fontSize: 20 } } }}
                          className={styles.columnItemButton}
                          onClick={() => moveColumn(col, -1)}
                        />
                        <ActionButton
                          iconProps={{
                            iconName: 'ChevronDown',
                            styles: { root: { fontSize: 20 } }
                          }}
                          className={styles.columnItemButton}
                          onClick={() => moveColumn(col, 1)}
                        />
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
    </Panel>
  )
}
