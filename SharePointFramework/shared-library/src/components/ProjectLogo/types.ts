/**
 * @category ProjectLogo
 */
export interface IProjectLogoProps {
  /**
   * Project title
   *
   */
  title: string

  /**
   * Project URL
   *
   */
  url: string

  /**
   * Size of the project logo
   */
  size?: string

  /**
   * Render mode of the project logo (card or list)
   */
  renderMode?: 'card' | 'list'

  /**
   * On image load callback with boolean indicating if custom image is used.
   */
  onImageLoad?: (showCustomImage?: boolean) => void

  /**
   * Hide content
   */
  hidden?: boolean
}
