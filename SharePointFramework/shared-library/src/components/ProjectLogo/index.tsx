import { format } from '@fluentui/react'
import { Avatar } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import styles from './ProjectLogo.module.scss'
import { IProjectLogoProps } from './types'
import { useProjectLogo } from './useProjectLogo'

export * from './types'

/**
 * A component that renders an avatar or a logo for a project. The avatar is rendered if the project does not have a custom logo.
 *
 * @category ProjectLogo
 */
export const ProjectLogo: FC<IProjectLogoProps> = (props: IProjectLogoProps) => {
  const { showCustomImage, imageSource, handleImageLoad, handleImageError, conditionalStyling, isLoading } =
    useProjectLogo(props)

  if (isLoading) {
    return (
      <div
        className={styles.projectLogo}
        style={{ width: props.size, height: props.size }}
        hidden={props.hidden}
      />
    )
  }

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
        src={imageSource}
        style={{
          WebkitMask:
            props.renderMode === 'card' ? 'linear-gradient(white 50%, transparent)' : 'none',
          display: showCustomImage ? 'block' : 'none',
          ...conditionalStyling
        }}
        title={format(strings.Aria.ProjectTitle, props.title)}
        alt={format(strings.Aria.ProjectTitle, props.title)}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  )
}

ProjectLogo.defaultProps = {
  size: '100%'
}
