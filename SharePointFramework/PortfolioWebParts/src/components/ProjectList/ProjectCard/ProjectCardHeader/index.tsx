import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { IProjectCardHeaderProps } from './types'
import { Avatar, CardHeader, CardPreview, Link, Text } from '@fluentui/react-components'
import useImageColor from 'use-image-color'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const { project, useDynamicColors, showProjectLogo } = useContext(ProjectCardContext)
  const [showCustomImage, setShowCustomImage] = React.useState(true)
  let colors = { colors: ['black', 'black'] }

  if (useDynamicColors)
    colors = useImageColor(
      project.logo ?? `${project.url}/_api/siteiconmanager/getsitelogo?type='1'`,
      { cors: true, colors: 2, windowSize: 5 }
    ).colors

  return (
    <>
      <CardPreview
        className={styles.preview}
      >
        {showCustomImage && (
          <div
            className={useDynamicColors ? styles.dynamicHeader : styles.header}
            style={{ color: useDynamicColors && colors && colors[1] }}>
            <Link href={project.url} target={'_blank'} className={styles.link}>
              <Text
                className={styles.projectTitle}
                title={project.title}
                weight={'semibold'}
                wrap={false}
                size={400}
                truncate
                block
              >
                {project.title}
              </Text>
            </Link>
          </div>
        )}
        <div className={styles.logo} hidden={!showProjectLogo}>
          <Link
            href={project.url}
            target={'_blank'}
            className={styles.link}
            style={{
              background: `linear-gradient(to right,
                ${colors && colors[0]},
                ${colors && colors[0]})`
            }}
          >
            <Avatar
              className={styles.projectAvatar}
              aria-label={`Logo for project: ${project.title}'`}
              title={`Logo for project: ${project.title}'`}
              color={'colorful'}
              shape={'square'}
              style={{ display: showCustomImage ? 'none' : 'block' }}
              name={project.title?.slice(-2).toUpperCase()}
              initials={project.title}
            />
            <img
              src={project.logo ?? `${project.url}/_api/siteiconmanager/getsitelogo?type='1'`}
              style={{
                WebkitMask: 'linear-gradient(white 50%, transparent)',
                display: !showCustomImage ? 'none' : 'block'
              }}
              alt={`Logo for project: ${project.title}'`}
              onLoad={(image) => {
                props.onImageLoad
                setShowCustomImage(
                  (image.target as HTMLImageElement).naturalHeight !== 648 ? true : false
                )
              }}
            />
          </Link>
        </div>
      </CardPreview>
    </>
  )
}
