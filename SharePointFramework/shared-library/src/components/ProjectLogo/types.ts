/**
 * Configures a project logo, its initials fallback and card or list presentation.
 */
export interface IProjectLogoProps {
  title: string

  url: string

  size?: string

  renderMode?: 'card' | 'list'

  /**
   * On image load callback with boolean indicating if custom image is used.
   */
  onImageLoad?: (showCustomImage?: boolean) => void

  hidden?: boolean

  /**
   * Fallback image URL to use when project has no custom logo (e.g., template image)
   */
  fallbackImageUrl?: string
}
