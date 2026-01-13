import { useState, useEffect } from 'react'
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
  const [imageSource, setImageSource] = useState(
    `${props.url}/_api/siteiconmanager/getsitelogo?type='1'`
  )
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Checks if the image is a custom image.
   *
   * @param image - The image to check.
   *
   * @returns A boolean indicating if the image is a custom image.
   */
  const shouldUseCustomImage = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const height = (image.target as HTMLImageElement).naturalHeight
    return height !== 648 && height !== 96 && height !== 1024
  }

  /**
   * Preload the initial image to determine whether to show custom image or initials
   */
  useEffect(() => {
    setIsLoading(true)
    const img = new Image()
    const initialUrl = `${props.url}/_api/siteiconmanager/getsitelogo?type='1'`
    
    img.onload = () => {
      const height = img.naturalHeight
      const isCustom = height !== 648 && height !== 96 && height !== 1024
      
      if (isCustom) {
        setImageSource(initialUrl)
        setShowCustomImage(true)
        setIsLoading(false)
        if (props.onImageLoad) {
          props.onImageLoad(true)
        }
      } else if (props.fallbackImageUrl) {
        setImageSource(props.fallbackImageUrl)
        setShowCustomImage(true)
        setIsLoading(false)
        if (props.onImageLoad) {
          props.onImageLoad(true)
        }
      } else {
        setShowCustomImage(false)
        setIsLoading(false)
      }
    }
    
    img.onerror = () => {
      if (props.fallbackImageUrl) {
        setImageSource(props.fallbackImageUrl)
        setShowCustomImage(true)
      } else {
        setShowCustomImage(false)
      }
      setIsLoading(false)
    }
    
    img.src = initialUrl
  }, [props.url, props.fallbackImageUrl])

  /**
   * Handle image load for the visible image element
   */
  const handleImageLoad = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (props.onImageLoad && showCustomImage) {
      props.onImageLoad(true)
    }
  }

  /**
   * Handle image error for the visible image element
   */
  const handleImageError = () => {
    setShowCustomImage(false)
  }

  const conditionalStyling = {
    fontSize: props.renderMode === 'card' ? '22px' : '14px',
    height: props.renderMode === 'card' ? '100%' : '80%',
    width: props.renderMode === 'card' ? '100%' : '80%',
    borderRadius: props.renderMode === 'card' ? 0 : 'var(--borderRadiusMedium)',
    margin: props.renderMode === 'card' ? 0 : '5px'
  }

  return {
    showCustomImage,
    imageSource,
    handleImageLoad,
    handleImageError,
    conditionalStyling,
    isLoading
  }
}
