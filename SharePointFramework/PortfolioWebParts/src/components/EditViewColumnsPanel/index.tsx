import { Panel, PanelType } from '@fluentui/react'
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
import { IEditViewColumnsPanelProps } from './types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { Button, Checkbox, FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { WebPartTitle, getFluentIcon, customLightTheme } from 'pp365-shared-library'

const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})

export const EditViewColumnsPanel: FC<IEditViewColumnsPanelProps> = (props) => {
  const {
    onDragEnd,
    selectableColumns,
    onChange,
    onSave,
    moveColumn,
    fluentProviderHeaderId,
    fluentProviderBodyId,
    selectedColumns
  } = useEditViewColumnsPanel(props)

  return (
    <Panel
      isOpen={props.isOpen}
      type={PanelType.medium}
      onRenderHeader={() => (
        <IdPrefixProvider value={fluentProviderHeaderId}>
          <FluentProvider theme={customLightTheme}>
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
          </FluentProvider>
        </IdPrefixProvider>
      )}
      onDismiss={props.onDismiss}
      isLightDismiss={true}
      className={styles.root}
    >
      <IdPrefixProvider value={fluentProviderBodyId}>
        <FluentProvider theme={customLightTheme}>
          <WebPartTitle title={props.title} description={props.helpText} />
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId='droppable'>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {selectableColumns.map((col, idx) => (
                    <Draggable
                      key={col.name}
                      draggableId={col.name}
                      index={idx}
                      isDragDisabled={!col.data.isSelected}
                    >
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
                            onChange={(_event, data) => onChange(col, !!data.checked, idx)}
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </FluentProvider>
      </IdPrefixProvider>
    </Panel>
  )
}

EditViewColumnsPanel.defaultProps = {
  title: strings.EditViewColumnsPanelHeaderText,
  helpText: strings.EditViewColumnsPanelHelpText,
  columns: [],
  customColumnOrder: []
}
