import React, { FC } from 'react'
import { IFileNameColumnProps } from './types'
import { Icon, Link } from '@fluentui/react'
import { getFileTypeIconProps } from '@fluentui/react-file-type-icons'

export const FileNameColumn: FC<IFileNameColumnProps> = (props) => {
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
