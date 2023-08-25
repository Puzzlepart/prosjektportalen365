import { useState } from 'react'
import { IProjectLogoProps } from './types'

/**
 * Custom React hook for and managing project logo.
 *
 * @param props - The props for the ProjectLogo component.
 *
 * @returns An object containing the conditional styling based on project logo type.
 */
export function useProjectLogo(props: IProjectLogoProps) {
  const [showCustomImage, setShowCustomImage] = useState(true)
  
  /**
   * Checks if the image is a custom image.
   *
   * @param image - The image to check.
   *
   * @returns A boolean indicating if the image is a custom image.
   *
   */
  const useCustomImage = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    return (image.target as HTMLImageElement).naturalHeight !== 648
      ? (image.target as HTMLImageElement).naturalHeight !== 96
        ? true
        : false
      : false
  }

  const conditionalStyling = {
    fontSize: props.type === 'card' ? '22px' : '14px',
    height: props.type === 'card' ? '100%' : '80%',
    width: props.type === 'card' ? '100%' : '80%',
    borderRadius: props.type === 'card' ? 0 : 'var(--borderRadiusMedium)',
    margin: props.type === 'card' ? 0 : '5px'
  }

  return {
    useCustomImage,
    showCustomImage,
    setShowCustomImage,
    conditionalStyling
  }
}
