import { ActionButton, Checkbox, Panel, PanelType } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import {
  DragDropContext,
  Draggable,
  DraggingStyle,
  Droppable,
  NotDraggingStyle
} from 'react-beautiful-dnd'
import styles from './EditViewColumnsPanel.module.scss'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import _ from 'lodash'
import { PortfolioOverviewContext } from '../context'

const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})

export const EditViewColumnsPanel: FC = () => {
  const context = useContext(PortfolioOverviewContext)
  const {
    onDismiss,
    onDragEnd,
    selectedColumns,
    onChange,
    onSave,
    onRevertCustomOrder,
    moveColumn
  } = useEditViewColumnsPanel()

  return (
    <Panel
      isOpen={context.state.editViewColumns.isOpen}
      type={PanelType.medium}
      onRenderHeader={() => (
        <div className={styles.header}>
          <ActionButton
            text={strings.UseChangesButtonText}
            iconProps={{ iconName: 'CheckMark' }}
            onClick={onSave}
          />
          <ActionButton
            text={strings.RevertCustomOrderButtonText}
            title={strings.RevertCustomOrderButtonTooltip}
            iconProps={{ iconName: 'Undo' }}
            styles={{ root: { marginLeft: 3 } }}
            onClick={onRevertCustomOrder}
            disabled={_.isEmpty(context.state.currentView.columnOrder)}
          />
        </div>
      )}
      onDismiss={onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <h2 className={styles.title}>{strings.EditViewColumnsPanelHeaderText}</h2>
      <p className={styles.helpText}>{strings.PortfolioOverviewShowEditViewColumnsPanelHelpText}</p>
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
                        checked={col.data.selected}
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
