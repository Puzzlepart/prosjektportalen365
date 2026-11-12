import { IFileTypeIconOptions } from '@fluentui/react-file-type-icons'
import { CSSProperties } from 'react'

/**
 * Configures an Office file-type image and its presentation.
 */
export interface IFileTypeIconProps extends IFileTypeIconOptions {
  className?: string

  /**
   * Style of the image, after the default vertical alignment.
   */
  style?: CSSProperties
}
