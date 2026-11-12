import { IFileTypeIconOptions } from '@fluentui/react-file-type-icons'
import { IProgressProps } from 'pp365-shared-library'

/** Progress and file-type glyph for the template currently being copied. */
export interface ICopyProgressScreenProps extends IProgressProps {
  iconOptions: IFileTypeIconOptions
}
