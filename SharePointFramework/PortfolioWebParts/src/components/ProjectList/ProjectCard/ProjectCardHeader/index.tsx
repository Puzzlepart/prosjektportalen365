import { Avatar, CardPreview, Link, Text } from '@fluentui/react-components'
import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { IProjectCardHeaderProps } from './types'
import { useProjectCardHeader } from './useProjectCardHeader'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const context = useContext(ProjectCardContext)
  const { showCustomImage, setShowCustomImage, colors, headerProps } = useProjectCardHeader()

  return (
    <>
      <CardPreview className={styles.preview}>
        {showCustomImage && (
          <div {...headerProps}>
            <Link href={context.project.url} target='_blank' className={styles.link}>
              <Text
                className={styles.projectTitle}
                title={context.project.title}
                weight='semibold'
                wrap={false}
                size={400}
                truncate
                block
              >
                {context.project.title}
              </Text>
            </Link>
          </div>
        )}
        {context.showProjectLogo && (
          <div className={styles.logo}>
            <Link
              href={context.project.url}
              target='_blank'
              className={styles.link}
              style={{
                background: `linear-gradient(to right,
                ${colors && colors[0]},
                ${colors && colors[0]})`
              }}
            >
              <Avatar
                className={styles.projectAvatar}
                aria-label={`Logo for project: ${context.project.title}'`}
                title={`Logo for project: ${context.project.title}'`}
                color='colorful'
                shape='square'
                style={{ display: showCustomImage ? 'none' : 'block' }}
                name={context.project.title?.slice(-2).toUpperCase()}
                initials={context.project.title}
              />
              <img
                src={
                  context.project.logo ??
                  `${context.project.url}/_api/siteiconmanager/getsitelogo?type='1'`
                }
                style={{
                  WebkitMask: 'linear-gradient(white 50%, transparent)',
                  display: !showCustomImage ? 'none' : 'block'
                }}
                alt={`Logo for project: ${context.project.title}'`}
                onLoad={(image) => {
                  props.onImageLoad
                  setShowCustomImage(
                    (image.target as HTMLImageElement).naturalHeight !== 648
                      ? (image.target as HTMLImageElement).naturalHeight !== 96
                        ? true
                        : false
                      : false
                  )
                }}
              />
            </Link>
          </div>
        )}
      </CardPreview>
    </>
  )
}
