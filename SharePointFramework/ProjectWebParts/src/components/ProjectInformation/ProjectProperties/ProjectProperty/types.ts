import { DisplayMode } from '@microsoft/sp-core-library'
import { EditableSPField } from 'pp365-shared-library'

export interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Project property model
   */
  model: EditableSPField

  /**
   * Display mode if not inherited from parent
   */
  displayMode?: DisplayMode
}
