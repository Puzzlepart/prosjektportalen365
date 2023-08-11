import { ActionButton, Checkbox, Panel, PanelType } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggingStyle,
  Droppable,
  NotDraggingStyle
} from 'react-beautiful-dnd'
import styles from './EditViewColumnsPanel.module.scss'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { IEditViewColumnsPanelProps } from './types'

const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})

export const EditViewColumnsPanel: FC<IEditViewColumnsPanelProps> = (props) => {
  const { onDragEnd, selectableColumns, onChange, onSave, moveColumn, isChanged } =
    useEditViewColumnsPanel(props)

  return (
    <Panel
      isOpen={props.isOpen}
      type={PanelType.medium}
      onRenderHeader={() => (
        <div className={styles.panelActions}>
          <ActionButton
            text={strings.UseChangesButtonText}
            iconProps={{ iconName: 'CheckMark' }}
            onClick={onSave}
            disabled={!isChanged}
          />
          {props.revertOrder && (
            <ActionButton
              text={strings.RevertCustomOrderButtonText}
              title={strings.RevertCustomOrderButtonTooltip}
              iconProps={{ iconName: 'Undo' }}
              styles={{ root: { marginLeft: 3 } }}
              disabled={props.revertOrder.disabled}
              onClick={() => {
                props.revertOrder.onClick(selectableColumns)
              }}
            />
          )}
        </div>
      )}
      onDismiss={props.onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <div className={styles.header}>
        <span className={styles.title}>{props.title}</span>
        <p className={styles.helpText}>{props.helpText}</p>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId='droppable'>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {selectableColumns.map((col, idx) => (
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
                        checked={col.data.isSelected}
                        onChange={(_event, checked) => onChange(col, checked)}
                        disabled={col.data.isLocked}
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

EditViewColumnsPanel.defaultProps = {
  title: strings.EditViewColumnsPanelHeaderText,
  helpText: strings.EditViewColumnsPanelHelpText,
  columns: [],
  customColumnOrder: []
}
