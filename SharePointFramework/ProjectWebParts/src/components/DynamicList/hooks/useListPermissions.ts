import { useEffect, useState } from 'react'
import { PermissionKind } from '@pnp/sp/security'
import { getWeb } from '../utils/webUtils'
import { WebContextMode } from '../types'
import '@pnp/sp/lists'
import '@pnp/sp/security'

/**
 * Permissions state for list operations.
 */
export interface IListPermissions {
  /**
   * Whether the current user can add items to the list.
   */
  canAdd: boolean

  /**
   * Whether the current user can edit items in the list.
   */
  canEdit: boolean

  /**
   * Whether the current user can delete items from the list.
   */
  canDelete: boolean

  /**
   * Whether permissions are still being loaded.
   */
  isLoading: boolean
}

/**
 * Hook to check user permissions on a SharePoint list.
 *
 * Checks the following permissions:
 * - AddListItems: Can create new items
 * - EditListItems: Can edit existing items
 * - DeleteListItems: Can delete items
 *
 * Respects webContextMode to check permissions on the correct site.
 *
 * @param listName Internal name or title of the list
 * @param webUrl Optional web URL (for CustomSite mode)
 * @param webContextMode Mode determining which web to use
 * @returns Object containing permission flags and loading state
 */
export function useListPermissions(
  listName: string,
  webUrl?: string,
  webContextMode?: WebContextMode
): IListPermissions {
  const [permissions, setPermissions] = useState<IListPermissions>({
    canAdd: false,
    canEdit: false,
    canDelete: false,
    isLoading: true
  })

  useEffect(() => {
    if (!listName) {
      setPermissions({
        canAdd: false,
        canEdit: false,
        canDelete: false,
        isLoading: false
      })
      return
    }

    const checkPermissions = async () => {
      try {
        const web = getWeb(webUrl, webContextMode)
        const list = web.lists.getByTitle(listName)

        const [canAdd, canEdit, canDelete] = await Promise.all([
          list.currentUserHasPermissions(PermissionKind.AddListItems),
          list.currentUserHasPermissions(PermissionKind.EditListItems),
          list.currentUserHasPermissions(PermissionKind.DeleteListItems)
        ])

        setPermissions({
          canAdd,
          canEdit,
          canDelete,
          isLoading: false
        })
      } catch (error) {
        console.error('[useListPermissions] Error checking permissions:', error)
        setPermissions({
          canAdd: false,
          canEdit: false,
          canDelete: false,
          isLoading: false
        })
      }
    }

    checkPermissions()
  }, [listName, webUrl, webContextMode])

  return permissions
}
