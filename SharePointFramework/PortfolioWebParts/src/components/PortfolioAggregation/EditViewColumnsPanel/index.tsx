import { Checkbox, DefaultButton, Panel, PrimaryButton } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { DragDropContext, Draggable, DraggingStyle, Droppable, NotDraggingStyle } from 'react-beautiful-dnd'
import { TOGGLE_SHOW_HIDE_COLUMN_PANEL } from '../reducer'
import styles from './EditViewColumnsPanel.module.scss'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'

const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})

export const EditViewColumnsPanel: FC = () => {
  const { state, onDismiss, onDragEnd, selectedColumns, onChange, onSave, isChanged, dispatch } =
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
                      style={getItemStyle(snapshot.isDragging, provided.draggableProps.style) as any}
                    >
                      <Checkbox
                        label={col.name}
                        checked={col.selected}
                        onChange={(_event, checked) => onChange(col, checked)} />
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
