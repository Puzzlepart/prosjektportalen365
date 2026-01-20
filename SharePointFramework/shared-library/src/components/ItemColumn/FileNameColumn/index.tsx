import { Icon } from '@fluentui/react'
import { FileIconType, getFileTypeIconProps } from '@fluentui/react-file-type-icons'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IFileNameColumnProps } from './types'
import { Link } from '@fluentui/react-components'

export const FileNameColumn: ColumnRenderComponent<IFileNameColumnProps> = (props) => {
  const isFolder = props.item.FSObjType === 1

  const getFileUrl = () => {
    if (isFolder || !props.item.FileRef) return null

    if (props.item.ServerRedirectedURL) {
      return props.item.ServerRedirectedURL
    }

    const fileRef = props.item.FileRef as string
    const parts = fileRef.split('/').filter((p) => p)
    let siteUrl = window.location.origin

    if (parts[0] === 'sites' && parts[1]) {
      siteUrl = `${siteUrl}/sites/${parts[1]}`
    }

    return `${siteUrl}/_layouts/15/Doc.aspx?sourcedoc=${encodeURIComponent(fileRef)}&action=default`
  }

  const fileUrl = getFileUrl()

  return (
    <span>
      {props.showFileExtensionIcon && (
        <Icon
          {...getFileTypeIconProps({
            extension: props.item.File_x0020_Type || props.item.FileExtension,
            type: isFolder ? FileIconType.folder : undefined,
            size: 20,
            imageFileType: 'svg'
          })}
          styles={{ root: { verticalAlign: 'bottom' } }}
        />
      )}
      {isFolder ? (
        <span style={{ marginLeft: 8 }}>{props.columnValue}</span>
      ) : fileUrl ? (
        <Link href={fileUrl} rel='noopener noreferrer' target='_blank' style={{ marginLeft: 8 }}>
          {props.columnValue}
        </Link>
      ) : (
        <span style={{ marginLeft: 8 }}>{props.columnValue}</span>
      )}
    </span>
  )
}

FileNameColumn.defaultProps = {
  showFileExtensionIcon: true
}
FileNameColumn.key = 'filename'
FileNameColumn.id = 'Filename'
FileNameColumn.displayName = strings.ColumnRenderOptionFilename
FileNameColumn.iconName = 'FileImage'
