import { DisplayMode } from '@microsoft/sp-core-library'
import { ProjectInformationField } from 'pp365-shared-library/lib/models'

export interface IProjectPropertyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Project property model
   */
  model: ProjectInformationField

  /**
   * Display mode if not inherited from parent
   */
  displayMode?: DisplayMode
}
