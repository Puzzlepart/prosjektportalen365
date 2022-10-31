import { IProjectCardProps } from '../types'

export interface IProjectCardHeaderProps
  extends Pick<IProjectCardProps, 'project' | 'showProjectLogo' | 'shouldTruncateTitle'> {
  onImageLoad?: () => void
}
