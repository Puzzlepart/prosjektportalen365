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
  canAdd: boolean

  canEdit: boolean

  canDelete: boolean

  isLoading: boolean
}

/** Checks add, edit and delete permissions on the list in its configured target web. */
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

    void checkPermissions()
  }, [listName, webUrl, webContextMode])

  return permissions
}
