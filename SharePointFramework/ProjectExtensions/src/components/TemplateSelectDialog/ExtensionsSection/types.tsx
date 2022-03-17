import { ProjectExtension } from '../../../models'

export interface IExtensionsSectionProps {
  /**
   * Extensions
   */
  extensions?: ProjectExtension[]

  /**
   * Currently selected extensions
   */
  selectedExtensions?: ProjectExtension[]

  /**
   * Locks (disables) the default extensions
   */
  lockDefault?: boolean

  /**
   * On extensions changed
   */
  onChange: (selectedExtensions: ProjectExtension[]) => void
}
