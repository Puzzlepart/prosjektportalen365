import '@pnp/sp/files'
import '@pnp/sp/files/folder'
import '@pnp/sp/folders'
import '@pnp/sp/lists'
import type { IFileInfo } from '@pnp/sp/files'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { useCallback, useContext } from 'react'
import { DynamicListContext } from '../context'
import { stampSiteIdFieldsOnFile } from '../utils/listOperationUtils'
import { useNotify } from './useNotify'

/**
 * Uploads files to the document library's current folder, or to its root, under the project's
 * folder when the web part uses one, and tells which files were uploaded or why they were not.
 * The toolbar's upload and a drop on the library share it.
 *
 * @returns A function uploading the files given
 */
export function useFileUpload(): (files: File[]) => Promise<void> {
  const context = useContext(DynamicListContext)
  const notify = useNotify()

  return useCallback(
    async (files: File[]) => {
      if (!context.props.listName || files.length === 0) return
      try {
        const list = context.web.lists.getByTitle(context.props.listName)
        let folderPath = context.state.currentFolderPath || ''

        if (context.props.useProjectFolder) {
          const projectFolderName = context.props.webTitle
          if (projectFolderName) {
            try {
              await list.rootFolder.folders.getByUrl(projectFolderName)()
            } catch {
              await list.rootFolder.folders.addUsingPath(projectFolderName)
            }
            if (!folderPath) {
              folderPath = projectFolderName
            } else if (
              !folderPath.startsWith(projectFolderName + '/') &&
              folderPath !== projectFolderName
            ) {
              folderPath = `${projectFolderName}/${folderPath}`
            }
          }
        }

        const listData = await list.select('RootFolder/ServerRelativeUrl').expand('RootFolder')()
        const listRootPath = listData.RootFolder.ServerRelativeUrl

        for (const file of files) {
          let addedFile: IFileInfo
          if (folderPath) {
            const targetFolder = context.web.getFolderByServerRelativePath(
              `${listRootPath}/${folderPath}`
            )
            addedFile = await targetFolder.files.addUsingPath(file.name, file, { Overwrite: true })
          } else {
            addedFile = await list.rootFolder.files.addUsingPath(file.name, file, {
              Overwrite: true
            })
          }

          if (context.props.useSiteIdFiltering && addedFile) {
            await stampSiteIdFieldsOnFile(
              context.web,
              addedFile,
              context.props.siteId,
              context.props.webTitle
            )
          }
        }

        notify(
          'success',
          files.length === 1
            ? format(strings.DynamicList.FileUploaded, files[0].name)
            : format(strings.DynamicList.FilesUploaded, files.length)
        )
        context.setState({ refetch: Date.now() })
      } catch (error) {
        console.error('Error uploading files:', error)
        notify('error', strings.DynamicList.UploadFailed, error?.message)
      }
    },
    [context.props, context.state.currentFolderPath, context.setState, context.web, notify]
  )
}
