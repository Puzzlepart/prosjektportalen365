import { IFolderNavigationItem, IFolderNavigationProps } from './types'

/** Builds breadcrumb entries for the path below a /sites/<site>/<library> prefix. */
export const createItems = ({
  currentFolder,
  setFolder
}: Partial<IFolderNavigationProps>): IFolderNavigationItem[] => {
  if (!currentFolder) return []
  const paths = currentFolder.split('/').splice(4)
  return paths.map((f, idx) => {
    const item: IFolderNavigationItem = {
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
