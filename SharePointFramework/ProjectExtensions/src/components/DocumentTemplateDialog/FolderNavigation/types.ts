import { IBreadcrumbProps } from '@fluentui/react/lib/Breadcrumb'

export interface IFolderNavigationProps extends Partial<IBreadcrumbProps> {
  /**
   * Root level name (typically library name)
   */
  root: string

  /**
   * Current folder URL
   */
  currentFolder: string

  /**
   * Set folder
   *
   * @param folder Folder URL
   */
  setFolder: (folder: string) => void
}
