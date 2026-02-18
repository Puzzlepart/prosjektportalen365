import { Icon } from '@fluentui/react'
import { FileIconType, getFileTypeIconProps } from '@fluentui/react-file-type-icons'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IFileNameColumnProps } from './types'
import { Button } from '@fluentui/react-components'

export const FileNameColumn: ColumnRenderComponent<IFileNameColumnProps> = (props) => {
  const contentTypeId = props.item.ContentTypeId || ''
  const isFolder = props.item.FSObjType === 1
  const isDocSet = contentTypeId.indexOf("0x0120D520") === 0

  const getFileUrl = () => {
    if (isFolder || !props.item.FileRef) return null

    if (props.item.ServerRedirectedURL) {
      return props.item.ServerRedirectedURL
    }

    const fileRef = props.item.FileRef as string
    const fileType = props.item.File_x0020_Type || props.item.FileExtension
    const parts = fileRef.split('/').filter((p) => p)
    let siteUrl = window.location.origin

    if (parts[0] === 'sites' && parts[1]) {
      siteUrl = `${siteUrl}/sites/${parts[1]}`
    }

    if (fileType === 'pdf') {
      return `${fileRef}?download=1`
    }

    return `${siteUrl}/_layouts/15/Doc.aspx?sourcedoc=${encodeURIComponent(fileRef)}&action=view`
  }

  const fileUrl = getFileUrl()

  const iconType = isDocSet
    ? FileIconType.docset
    : (isFolder ? FileIconType.folder : undefined);

  return (
    <span>
      {props.showFileExtensionIcon && (
        <Icon
          {...getFileTypeIconProps({
            extension: props.item.File_x0020_Type || props.item.FileExtension,
            type: iconType,
            size: 20,
            imageFileType: 'svg'
          })}
          styles={{ root: { verticalAlign: 'bottom' } }}
        />
      )}
      {isFolder ? (
        <span style={{ marginLeft: 8 }}>{props.columnValue}</span>
      ) : fileUrl ? (
        <Button
          appearance='transparent'
          onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
          style={{ marginLeft: 8 }}
        >
          {props.columnValue}
        </Button>
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
