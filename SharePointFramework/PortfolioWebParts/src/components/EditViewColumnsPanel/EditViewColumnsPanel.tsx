import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import { DragDropContext, Draggable, DraggableProvided, Droppable } from '@hello-pangea/dnd'
import styles from './EditViewColumnsPanel.module.scss'
import { IEditViewColumnsPanelProps } from './types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { Button, Checkbox, Portal } from '@fluentui/react-components'
import { BasePanel, IListColumn, WebPartTitle, getFluentIcon } from 'pp365-shared-library'
import { getItemStyle } from './getItemStyle'

export const EditViewColumnsPanel: FC<IEditViewColumnsPanelProps> = (props) => {
  const { onDragEnd, selectableColumns, onChange, onSave, moveColumn, selectedColumns } =
    useEditViewColumnsPanel(props)

  /** A column's row: the list and the dragged copy draw the same one. */
  const renderColumnItem = (
    col: IListColumn,
    idx: number,
    provided: DraggableProvided,
    isDragging: boolean
  ) => (
    <div
      className={styles.columnItem}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={getItemStyle(isDragging, provided.draggableProps.style) as any}
    >
      <Checkbox
        label={col.name}
        checked={col.data.isSelected}
        onChange={(_event, data) => onChange(col, Boolean(data.checked))}
        disabled={col.data.isLocked}
      />
      <div className={styles.columnItemActions}>
        <Button
          appearance='transparent'
          size='medium'
          icon={getFluentIcon('ChevronUp')}
          title={
            !col.data.isSelected
              ? strings.Aria.MoveDisabled
              : idx === 0
                ? strings.Aria.MoveUpDisabled
                : strings.Aria.MoveUp
          }
          disabled={!col.data.isSelected || idx === 0}
          onClick={() => moveColumn(col, -1)}
        />
        <Button
          appearance='transparent'
          size='medium'
          icon={getFluentIcon('ChevronDown')}
          title={
            !col.data.isSelected
              ? strings.Aria.MoveDisabled
              : idx === selectedColumns.length - 1
                ? strings.Aria.MoveDownDisabled
                : strings.Aria.MoveDown
          }
          disabled={!col.data.isSelected || idx === selectedColumns.length - 1}
          onClick={() => moveColumn(col, 1)}
        />
      </div>
    </div>
  )

  return (
    <BasePanel
      open={props.open}
      size={'medium'}
      header={
        <div className={styles.panelActions}>
          <Button
            appearance='subtle'
            size='medium'
            icon={getFluentIcon('Checkmark')}
            title={strings.UseChangesButtonText}
            onClick={onSave}
          >
            {strings.UseChangesButtonText}
          </Button>
          {props.revertOrder && (
            <Button
              appearance='subtle'
              size='medium'
              icon={getFluentIcon('ArrowUndo')}
              title={strings.RevertCustomOrderButtonTooltip}
              disabled={props.revertOrder.disabled}
              onClick={() => {
                props.revertOrder.onClick(selectableColumns)
              }}
            >
              {strings.RevertCustomOrderButtonText}
            </Button>
          )}
        </div>
      }
      onClose={props.onClose}
      isLightDismiss={true}
      className={styles.root}
    >
      <WebPartTitle title={props.title} description={props.helpText} />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId='droppable'
          // The drawer keeps an identity transform after sliding in, which makes it the
          // containing block of the dragged item's `position: fixed`: the item was placed
          // relative to the drawer, off to the right and clipped by it. The dragged copy is
          // drawn in a Fluent portal instead, on the page, themed and on the panel's layer,
          // inside a `.root` so the row's nested styles still apply.
          renderClone={(provided, snapshot, rubric) => (
            <Portal>
              <div className={styles.root}>
                {renderColumnItem(
                  selectableColumns[rubric.source.index],
                  rubric.source.index,
                  provided,
                  snapshot.isDragging
                )}
              </div>
            </Portal>
          )}
        >
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {selectableColumns.map((col, idx) => (
                <Draggable
                  key={col.name}
                  draggableId={col.name}
                  index={idx}
                  isDragDisabled={!col.data.isSelected}
                >
                  {(provided, snapshot) =>
                    renderColumnItem(col, idx, provided, snapshot.isDragging)
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </BasePanel>
  )
}

EditViewColumnsPanel.displayName = 'EditViewColumnsPanel'
EditViewColumnsPanel.defaultProps = {
  title: strings.EditViewColumnsPanelHeaderText,
  helpText: strings.EditViewColumnsPanelHelpText,
  columns: [],
  customColumnOrder: []
}
