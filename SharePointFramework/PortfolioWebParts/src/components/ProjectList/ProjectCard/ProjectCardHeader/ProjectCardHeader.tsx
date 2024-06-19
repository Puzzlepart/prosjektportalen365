import { CardPreview, Link, Text } from '@fluentui/react-components'
import React, { FC, useCallback, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { useProjectCardHeader } from './useProjectCardHeader'
import { IProjectCardHeaderProps } from './types'
import { ProjectLogo } from 'pp365-shared-library'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const context = useContext(ProjectCardContext)
  const { showCustomImage, setShowCustomImage, colors, headerProps } = useProjectCardHeader()

  /**
   * Callback function to set the showCustomImage state.
   */
  const customImageCallback = useCallback(
    (value: boolean) => {
      setShowCustomImage(value)
    },
    [context.showProjectLogo, showCustomImage]
  )

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
              <ProjectLogo
                title={context.project.title}
                url={context.project.url}
                renderMode='card'
                onImageLoad={(value) => {
                  props.onImageLoad
                  customImageCallback(value)
                }}
              />
            </Link>
          </div>
        )}
      </CardPreview>
    </>
  )
}
