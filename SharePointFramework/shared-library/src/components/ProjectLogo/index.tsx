import React, { FC, useState } from 'react'
import { IProjectLogoProps } from './types'
import styles from './ProjectLogo.module.scss'
import { Avatar } from '@fluentui/react-components'

/**
 * A component that renders an avatar or a logo for a project. The avatar is rendered if the project does not have a custom logo.
 *
 * @category ProjectLogo
 */
export const ProjectLogo: FC<IProjectLogoProps> = (props: IProjectLogoProps) => {
  const [showCustomImage, setShowCustomImage] = useState(true)
  const { title, url } = props

  return (
    <div className={styles.projectLogo}>
      <Avatar
        className={styles.projectAvatar}
        aria-label={`Logo for prosjekt: ${title}'`}
        title={`Logo for prosjekt: ${title}'`}
        color={'colorful'}
        shape={'square'}
        style={{ display: showCustomImage ? 'none' : 'block' }}
        name={title?.slice(-2).toUpperCase()}
        initials={title?.slice(0, 2).toUpperCase()}
      />
      <img
        src={`${url}/_api/siteiconmanager/getsitelogo?type='1'`}
        style={{
          display: !showCustomImage ? 'none' : 'block'
        }}
        title={`Logo for prosjekt: ${title}'`}
        alt={`Logo for prosjekt: ${title}'`}
        onLoad={(image) => {
          setShowCustomImage(
            (image.target as HTMLImageElement).naturalHeight !== 648
              ? (image.target as HTMLImageElement).naturalHeight !== 96
                ? true
                : false
              : false
          )
        }}
      />
    </div>
  )
}
