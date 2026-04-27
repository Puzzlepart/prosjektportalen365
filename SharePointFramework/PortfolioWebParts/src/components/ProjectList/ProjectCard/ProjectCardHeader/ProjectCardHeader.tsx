import { CardPreview, Link, Text } from '@fluentui/react-components'
import React, { FC, useCallback, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { useProjectCardHeader } from './useProjectCardHeader'
import { IProjectCardHeaderProps } from './types'
import { ProjectLogo } from 'pp365-shared-library'
import strings from 'PortfolioWebPartsStrings'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const context = useContext(ProjectCardContext)
  const { showCustomImage, setShowCustomImage, colors, headerProps } = useProjectCardHeader()
  const isDead = !!context.project?.isDead

  /**
   * Callback function to set the showCustomImage state.
   */
  const customImageCallback = useCallback(
    (value: boolean) => {
      setShowCustomImage(value)
    },
    [context.showProjectLogo, showCustomImage]
  )

  const titleEl = (
    <Text
      className={styles.projectTitle}
      title={isDead ? strings.DeadProjectTooltip : context.project?.title || strings.ProjectNotFound}
      weight='semibold'
      wrap={false}
      size={400}
      truncate
      block
    >
      {context.project?.title || strings.ProjectNotFound}
    </Text>
  )

  const logoEl = (
    <ProjectLogo
      title={context.project?.title || strings.ProjectNotFound}
      url={context.project?.url || '#'}
      renderMode='card'
      fallbackImageUrl={context.project?.templateImageUrl}
      onImageLoad={(value) => {
        props.onImageLoad
        customImageCallback(value)
      }}
    />
  )

  const logoStyle: React.CSSProperties = {
    background: `linear-gradient(to right,
                ${colors && colors[0]},
                ${colors && colors[0]})`
  }

  return (
    <>
      <CardPreview className={styles.preview}>
        {showCustomImage && (
          <div {...headerProps}>
            {isDead ? (
              <span className={styles.link} title={strings.DeadProjectTooltip}>
                {titleEl}
              </span>
            ) : (
              <Link href={context.project?.url || '#'} target='_blank' className={styles.link}>
                {titleEl}
              </Link>
            )}
          </div>
        )}
        {context.showProjectLogo && (
          <div className={styles.logo}>
            {isDead ? (
              <span className={styles.link} style={logoStyle} title={strings.DeadProjectTooltip}>
                {logoEl}
              </span>
            ) : (
              <Link
                href={context.project?.url || '#'}
                target='_blank'
                className={styles.link}
                style={logoStyle}
              >
                {logoEl}
              </Link>
            )}
          </div>
        )}
      </CardPreview>
    </>
  )
}
