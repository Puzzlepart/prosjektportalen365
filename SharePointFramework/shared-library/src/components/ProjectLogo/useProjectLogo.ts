import { useState, useEffect } from 'react'
import { IProjectLogoProps } from './types'

/**
 * Loads a custom site logo or template fallback, otherwise showing initials with mode-specific styling.
 */
export function useProjectLogo(props: IProjectLogoProps) {
  const [showCustomImage, setShowCustomImage] = useState(false)
  const [imageSource, setImageSource] = useState(
    `${props.url}/_api/siteiconmanager/getsitelogo?type='1'`
  )
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Distinguishes custom images from SharePoint's default logo heights of 96, 648 and 1024 pixels.
   */
  const shouldUseCustomImage = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const height = (image.target as HTMLImageElement).naturalHeight
    return height !== 648 && height !== 96 && height !== 1024
  }

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

  const handleImageLoad = (image: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (props.onImageLoad && showCustomImage) {
      props.onImageLoad(true)
    }
  }

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
