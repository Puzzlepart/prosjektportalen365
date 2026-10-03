import { IFileTypeIconOptions } from '@fluentui/react-file-type-icons'
import { CSSProperties } from 'react'

export interface IFileTypeIconProps extends IFileTypeIconOptions {
  /**
   * Class of the image.
   */
  className?: string

  /**
   * Style of the image, after the default vertical alignment.
   */
  style?: CSSProperties
}
