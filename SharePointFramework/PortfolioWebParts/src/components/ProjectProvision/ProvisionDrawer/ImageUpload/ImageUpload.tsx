import React, { FC, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './ImageUpload.module.scss'
import strings from 'PortfolioWebPartsStrings'

export const ImageUpload: FC<{
  onImageUpload: (image: string) => void
  currentImage?: string
}> = ({ onImageUpload, currentImage }) => {
  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject, acceptedFiles } =
    useDropzone({
      onDrop: (file) => {
        const reader = new FileReader()
        reader.readAsDataURL(file[0])
        reader.onload = () => {
          onImageUpload(reader.result as string)
        }
      },
      accept: {
        'image/jpeg': [],
        'image/jpg': [],
        'image/png': []
      },
      maxSize: 512000
    })

  const getColor = () => {
    if (isDragAccept) return '#00e676'
    if (isDragReject) return '#ff1744'
    if (isFocused) return '#2196f3'
    return '#e0e0e0'
  }

  const imagePreviewSrc = useMemo(() => {
    if (acceptedFiles.length > 0) {
      return URL.createObjectURL(acceptedFiles[0])
    }
    return currentImage
  }, [acceptedFiles, currentImage])

  const imagePreviewName = useMemo(() => {
    if (acceptedFiles.length > 0) {
      return acceptedFiles[0].name
    }
    return 'Uploaded image'
  }, [acceptedFiles])

  return (
    <div className={styles.imageUpload}>
      <div
        className={styles.dropzone}
        {...getRootProps({ isFocused, isDragAccept, isDragReject })}
        style={{ borderColor: getColor(), color: isDragReject && '#ff1744' }}
      >
        <input {...getInputProps()} />
        <p>{isDragReject ? strings.Provision.ImageDropZoneErrorText : strings.Provision.ImageDropZoneText}</p>
      </div>
      {imagePreviewSrc && (
        <div className={styles.imagePreview}>
          <img
            src={imagePreviewSrc}
            alt={imagePreviewName}
            title={imagePreviewName}
          />
        </div>
      )}
    </div>
  )
}
