import { IRenderItemColumnProps } from '../types'

/**
 * Controls whether file names include a file-type icon.
 */
export interface IFileNameColumnProps extends IRenderItemColumnProps {
  showFileExtensionIcon?: boolean
}
