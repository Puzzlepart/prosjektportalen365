import { IFileTypeIconOptions } from '@fluentui/react-file-type-icons'
import { IProgressProps } from 'pp365-shared-library'

export interface ICopyProgressScreenProps extends IProgressProps {
  /**
   * The file type glyph of the template being copied.
   */
  iconOptions: IFileTypeIconOptions
}
