import {
  DraggingStyle,
  NotDraggingStyle
} from 'react-beautiful-dnd'

export const getItemStyle = (_isDragging: boolean, draggableStyle: DraggingStyle | NotDraggingStyle) => ({
  userSelect: 'none',
  ...draggableStyle
})