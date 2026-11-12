import { DisplayMode } from '@microsoft/sp-core-library'
import { EditableSPField } from 'pp365-shared-library'

/** Field model and layout for a displayed or edited project property. */
export interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
  model: EditableSPField

  /**
   * Display mode if not inherited from parent
   */
  displayMode?: DisplayMode
}
