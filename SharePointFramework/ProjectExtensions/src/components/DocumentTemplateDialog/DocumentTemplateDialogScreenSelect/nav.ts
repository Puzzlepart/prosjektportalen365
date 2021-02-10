import { IBreadcrumbItem } from 'office-ui-fabric-react/lib/Breadcrumb'

export interface IGetNavParams {
    /**
     * Current folder URL
     */
    folder: string

    /**
     * Set folder URL
     */
    setFolder: (folder: string) => void
}

/**
 * Get nav (breadcrumb items) for DocumentTemplateDialogScreenSelect
 * 
 * @param {IGetNavParams} param0 Nav params
 */
export const getNav = ({ folder, setFolder }: IGetNavParams): IBreadcrumbItem[] => {
    const paths = folder.split('/').splice(4)
    return paths.map((f, idx) => {
        const item: IBreadcrumbItem = {
            key: idx.toString(),
            text: f,
            isCurrentItem: (paths.length - 1 === idx),
        }
        if (!item.isCurrentItem) {
            item.onClick = () => {
                const delCount = paths.length - (paths.length - 5 - idx)
                const newFolder = folder.split('/').splice(0, delCount).join('/')
                setFolder(newFolder)
            }
        }
        return item
    })
}