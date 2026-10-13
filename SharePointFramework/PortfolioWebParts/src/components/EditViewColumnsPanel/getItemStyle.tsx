import { DraggingStyle, NotDraggingStyle } from '@hello-pangea/dnd'

export const getItemStyle = (
  _isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle
) => ({
  userSelect: 'none',
  ...draggableStyle
})
