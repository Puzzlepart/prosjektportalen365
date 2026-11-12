import { ProjectContentColumn } from 'pp365-shared-library'

/** Column-editor visibility and optional existing content column to edit. */
export interface IColumnFormPanel {
  /**
   * Whether the panel is showing. This is component state, so it keeps its own
   * name rather than tracking the panel's `open` prop.
   */
  isOpen?: boolean
  column?: ProjectContentColumn
}
