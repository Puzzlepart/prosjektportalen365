import { format } from '@fluentui/react'
import { Avatar } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import styles from './ProjectLogo.module.scss'
import { IProjectLogoProps } from './types'
import { useProjectLogo } from './useProjectLogo'

/**
 * A component that renders an avatar or a logo for a project. The avatar is rendered if the project does not have a custom logo.
 *
 * @category ProjectLogo
 */
export const ProjectLogo: FC<IProjectLogoProps> = (props: IProjectLogoProps) => {
  const { shouldUseCustomImage, setShowCustomImage, showCustomImage, conditionalStyling } =
    useProjectLogo(props)

  return (
    <div
      className={styles.projectLogo}
      style={{ width: props.size, height: props.size }}
      hidden={props.hidden}
    >
      <Avatar
        className={`${styles.projectAvatar} ${props.renderMode === 'card' ? styles.hover : ''}`}
        aria-label={format(strings.Aria.ProjectTitle, props.title)}
        title={format(strings.Aria.ProjectTitle, props.title)}
        color='colorful'
        shape='square'
        style={{
          display: showCustomImage ? 'none' : 'block',
          ...conditionalStyling
        }}
        name={props.title?.slice(-2).toUpperCase()}
        initials={
          props.renderMode === 'card' ? props.title : props.title?.slice(0, 2).toUpperCase()
        }
      />
      <img
        className={props.renderMode === 'card' ? styles.hover : ''}
        src={`${props.url}/_api/siteiconmanager/getsitelogo?type='1'`}
        style={{
          WebkitMask:
            props.renderMode === 'card' ? 'linear-gradient(white 50%, transparent)' : 'none',
          display: !showCustomImage ? 'none' : 'block',
          ...conditionalStyling
        }}
        title={format(strings.Aria.ProjectTitle, props.title)}
        alt={format(strings.Aria.ProjectTitle, props.title)}
        onLoad={(image) => {
          setShowCustomImage(shouldUseCustomImage(image))
          if (props.onImageLoad) {
            props.onImageLoad(shouldUseCustomImage(image))
          }
        }}
      />
    </div>
  )
}

ProjectLogo.defaultProps = {
  size: '100%'
}
