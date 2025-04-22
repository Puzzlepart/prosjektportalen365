import React, { FC } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './ImageUpload.module.scss'
import strings from 'PortfolioWebPartsStrings'

export const ImageUpload: FC<{ onImageUpload: (image: string) => void }> = ({ onImageUpload }) => {
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
      }
    })

  const getColor = () => {
    if (isDragAccept) return '#00e676'
    if (isDragReject) return '#ff1744'
    if (isFocused) return '#2196f3'
    return '#e0e0e0'
  }

  return (
    <div className={styles.imageUpload}>
      <div
        className={styles.dropzone}
        {...getRootProps({ isFocused, isDragAccept, isDragReject })}
        style={{ borderColor: getColor() }}
      >
        <input {...getInputProps()} />
        <p>{strings.Provision.ImageDropZoneText}</p>
      </div>
      {acceptedFiles.length > 0 && (
        <div className={styles.imagePreview}>
          <img
            src={URL.createObjectURL(acceptedFiles[0])}
            alt={acceptedFiles[0].name}
            title={acceptedFiles[0].name}
          />
        </div>
      )}
    </div>
  )
}
