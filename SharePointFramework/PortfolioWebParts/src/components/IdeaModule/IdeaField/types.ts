import { EditableSPField } from 'pp365-shared-library'

export interface IIdeaFieldProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Project property model
   */
  model: EditableSPField
}
