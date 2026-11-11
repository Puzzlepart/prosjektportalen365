import { getFileTypeIconAsUrl } from '@fluentui/react-file-type-icons'
import React, { FC } from 'react'
import { IFileTypeIconProps } from './types'

/**
 * The coloured Office file type glyph of a file extension, a folder, a list or a document set, as
 * SharePoint shows it: the image the file type icon package names on Microsoft's CDN. v8's `Icon`
 * rendered the same image after `initializeFileTypeIcons` had registered it; this needs neither.
 */
export const FileTypeIcon: FC<IFileTypeIconProps> = ({ className, style, ...options }) => {
  const size = options.size ?? 16
  const src = getFileTypeIconAsUrl({ imageFileType: 'svg', ...options, size })
  if (!src) return null
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=''
      className={className}
      style={{ verticalAlign: 'bottom', ...style }}
    />
  )
}
