import { Icon } from '@fluentui/react'
import { FileIconType, getFileTypeIconProps } from '@fluentui/react-file-type-icons'
import strings from 'SharedLibraryStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IFileNameColumnProps } from './types'
import { Link } from '@fluentui/react-components'

export const FileNameColumn: ColumnRenderComponent<IFileNameColumnProps> = (props) => {
  const isFolder = props.item.FSObjType === 1

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
      ) : (
        <Link
          href={props.item.FileRef || props.item.ServerRedirectedURL}
          rel='noopener noreferrer'
          target='_blank'
          style={{ marginLeft: 8 }}
        >
          {props.columnValue}
        </Link>
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
