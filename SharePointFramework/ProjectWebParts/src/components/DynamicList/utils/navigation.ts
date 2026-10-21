import { IDynamicListContext } from '../context'

/**
 * Goes back from what the list shows: from an opened item to the list, or from a folder to the
 * folder above it. `useNavigationFocus` then gives focus to the link of the item or folder left.
 *
 * @param context The dynamic list's context
 */
export function goBack(context: IDynamicListContext): void {
  if (context.state.isDrilledDown) {
    context.setState({ isDrilledDown: false, selectedItem: undefined, selectedItems: [] })
  } else if (context.state.isDocumentLibrary && context.state.currentFolderPath) {
    const pathParts = context.state.currentFolderPath.split('/')
    pathParts.pop()
    context.setState({ currentFolderPath: pathParts.join('/') })
  }
}
