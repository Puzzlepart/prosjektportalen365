import { EditableSPField } from 'pp365-shared-library'

/** Field model and container attributes for an idea's name/value pair. */
export interface IIdeaFieldProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Idea field metadata and value.
   */
  model: EditableSPField
}
