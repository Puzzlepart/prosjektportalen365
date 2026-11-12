import { DraggingStyle, NotDraggingStyle } from '@hello-pangea/dnd'

/** Preserve drag positioning while preventing text selection on a column row. */
export const getItemStyle = (
  _isDragging: boolean,
  draggableStyle: DraggingStyle | NotDraggingStyle
) => ({
  userSelect: 'none',
  ...draggableStyle
})
