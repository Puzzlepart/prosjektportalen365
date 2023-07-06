import { Icon, Link } from '@fluentui/react'
import { getFileTypeIconProps } from '@fluentui/react-file-type-icons'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IFileNameColumnProps } from './types'
import { registerColumnRenderComponent } from '../columnRenderComponentRegistry'

export const FileNameColumn: ColumnRenderComponent<IFileNameColumnProps> = (props) => {
  return (
    <span>
      {props.showFileExtensionIcon && (
        <Icon
          {...getFileTypeIconProps({
            extension: props.item.FileExtension,
            size: 16,
            imageFileType: 'png'
          })}
          styles={{ root: { verticalAlign: 'bottom' } }}
        />
      )}
      <Link
        href={props.item.ServerRedirectedURL}
        rel='noopener noreferrer'
        target='_blank'
        style={{ marginLeft: 8 }}
      >
        {props.columnValue}
      </Link>
    </span>
  )
}

FileNameColumn.defaultProps = {
  showFileExtensionIcon: false
}
FileNameColumn.key = 'filename'
FileNameColumn.id = 'Filename'
FileNameColumn.displayName = strings.ColumnRenderOptionFilename
FileNameColumn.iconName = 'FileImage'
registerColumnRenderComponent(FileNameColumn)
