import { Icon } from '@fluentui/react'
import { getFileTypeIconProps } from '@fluentui/react-file-type-icons'
import React, { FC } from 'react'

export interface IFileTypeIconProps {
  /**
   * File extension without the leading dot (e.g. `docx`, `pdf`).
   * If the value contains a `.` (e.g. a full filename), the substring after the last `.` is used.
   */
  extension: string

  /**
   * Icon size — supported by the Fluent file-type-icons sprite. Defaults to 16.
   */
  size?: 16 | 20 | 24 | 32 | 40 | 48 | 64 | 96

  /**
   * Optional className passed through to the underlying `<Icon />`.
   */
  className?: string
}

const stripToExtension = (value: string): string => {
  if (!value) return ''
  const idx = value.lastIndexOf('.')
  return idx >= 0 ? value.slice(idx + 1).toLowerCase() : value.toLowerCase()
}

/**
 * Renders the appropriate Fluent file-type icon (Word, Excel, PDF, …) for a given file extension.
 * Wraps `@fluentui/react-file-type-icons`'s `getFileTypeIconProps` with the legacy `<Icon />` host.
 */
export const FileTypeIcon: FC<IFileTypeIconProps> = ({ extension, size = 16, className }) => (
  <Icon
    {...getFileTypeIconProps({
      extension: stripToExtension(extension),
      size,
      imageFileType: 'svg'
    })}
    className={className}
    styles={{
      root: {
        verticalAlign: 'middle',
        display: 'inline-block',
        width: size,
        height: size,
        lineHeight: 0
      }
    }}
  />
)
