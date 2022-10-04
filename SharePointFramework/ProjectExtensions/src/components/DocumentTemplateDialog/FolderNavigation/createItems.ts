import { IBreadcrumbItem } from 'office-ui-fabric-react/lib/Breadcrumb'
import { IFolderNavigationProps } from './types'
/**
 * Create breadcrum items
 *
 * @param props Folder navigation props
 */
export const createItems = ({
  currentFolder,
  setFolder
}: Partial<IFolderNavigationProps>): IBreadcrumbItem[] => {
  if (!currentFolder) return []
  const paths = currentFolder.split('/').splice(4)
  return paths.map((f, idx) => {
    const item: IBreadcrumbItem = {
      key: idx.toString(),
      text: f,
      isCurrentItem: paths.length - 1 === idx
    }
    if (!item.isCurrentItem) {
      item.onClick = () => {
        const delCount = paths.length - (paths.length - 5 - idx)
        const newFolder = currentFolder.split('/').splice(0, delCount).join('/')
        setFolder(newFolder)
      }
    }
    return item
  })
}
