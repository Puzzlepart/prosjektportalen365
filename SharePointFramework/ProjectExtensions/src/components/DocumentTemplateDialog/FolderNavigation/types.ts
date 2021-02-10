import { IBreadcrumbProps } from 'office-ui-fabric-react/lib/Breadcrumb'

export interface IFolderNavigationProps extends Partial<IBreadcrumbProps> {
    /**
     * Root level name (typically library name)
     */
    root: string

    /**
     * Current folder URL
     */
    currentFolder: string;

    /**
     * Set folder
     * 
     * @param {string} folder Folder URL
     */
    setFolder: (folder: string) => void
}