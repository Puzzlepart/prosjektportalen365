import { useState } from 'react'
import { IProjectLogoProps } from './types'

/**
 * Custom React hook for and managing project logo.
 *
 * @param props - The props for the ProjectLogo component.
 *
 * @returns An object containing the conditional styling based on project logo render mode.
 */
export function useProjectLogo(props: IProjectLogoProps) {
  const [showCustomImage, setShowCustomImage] = useState(false)

  /**
   * Checks if the image is a custom image.
   *
   * @param image - The image to check.
   *
   * @returns A boolean indicating if the image is a custom image.
   */
  const shouldUseCustomImage = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    return (image.target as HTMLImageElement).naturalHeight !== 648
      ? (image.target as HTMLImageElement).naturalHeight !== 96
        ? true
        : false
      : false
  }

  const conditionalStyling = {
    fontSize: props.renderMode === 'card' ? '22px' : '14px',
    height: props.renderMode === 'card' ? '100%' : '80%',
    width: props.renderMode === 'card' ? '100%' : '80%',
    borderRadius: props.renderMode === 'card' ? 0 : 'var(--borderRadiusMedium)',
    margin: props.renderMode === 'card' ? 0 : '5px'
  }

  return {
    shouldUseCustomImage,
    showCustomImage,
    setShowCustomImage,
    conditionalStyling
  }
}
