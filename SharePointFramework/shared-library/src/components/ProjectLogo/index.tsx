import React, { FC, useState } from 'react'
import { IProjectLogoProps } from './types'
import styles from './ProjectLogo.module.scss'
import { Avatar } from '@fluentui/react-components'
import { format } from '@fluentui/react'
import { useProjectLogo } from './useProjectLogo'
import strings from 'SharedLibraryStrings'

/**
 * A component that renders an avatar or a logo for a project. The avatar is rendered if the project does not have a custom logo.
 *
 * @category ProjectLogo
 */
export const ProjectLogo: FC<IProjectLogoProps> = (props: IProjectLogoProps) => {
  const [showCustomImage, setShowCustomImage] = useState(true)
  const { title, url, size = '100%', type, hidden = false } = props
  const { useCustomImage } = useProjectLogo()

  const conditionalStyling = {
    fontSize: type === 'card' ? '22px' : '14px',
    height: type === 'card' ? '100%' : '80%',
    width: type === 'card' ? '100%' : '80%',
    borderRadius: type === 'card' ? 0 : 'var(--borderRadiusMedium)',
    margin: type === 'card' ? 0 : '5px'
  }

  return (
    <div className={styles.projectLogo} style={{ width: size, height: size }} hidden={hidden}>
      <Avatar
        className={`${styles.projectAvatar} ${type === 'card' ? styles.hover : ''}`}
        aria-label={format(strings.Aria.ProjectTitle, title)}
        title={format(strings.Aria.ProjectTitle, title)}
        color='colorful'
        shape='square'
        style={{
          display: showCustomImage ? 'none' : 'block',
          ...conditionalStyling
        }}
        name={title?.slice(-2).toUpperCase()}
        initials={type === 'card' ? title : title?.slice(0, 2).toUpperCase()}
      />
      <img
        className={type === 'card' ? styles.hover : ''}
        src={`${url}/_api/siteiconmanager/getsitelogo?type='1'`}
        style={{
          WebkitMask: type === 'card' ? 'linear-gradient(white 50%, transparent)' : 'none',
          display: !showCustomImage ? 'none' : 'block',
          ...conditionalStyling
        }}
        title={format(strings.Aria.ProjectTitle, title)}
        alt={format(strings.Aria.ProjectTitle, title)}
        onLoad={(image) => {
          setShowCustomImage(useCustomImage(image)),
            props.onImageLoad(useCustomImage(image))
        }}
      />
    </div>
  )
}
