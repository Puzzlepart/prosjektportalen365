import React, { FC, useContext } from 'react'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardHeader.module.scss'
import { IProjectCardHeaderProps } from './types'
import { CardHeader, CardPreview, Link, Text } from '@fluentui/react-components'

export const ProjectCardHeader: FC<IProjectCardHeaderProps> = (props) => {
  const context = useContext(ProjectCardContext)
  return (
    <>
      <CardPreview
        className={styles.preview}
        logo={
          context.project.phase && (
            <div className={styles.logoBadge} title={context.project.phase}>
              {context.project.phase}
            </div>
          )
        }
      >
        <div className={styles.logo} hidden={!context.showProjectLogo}>
          <Link href={context.project.url} target='_blank' className={styles.link}>
            <img
              src={context.project.logo ?? `${context.project.url}/_api/siteiconmanager/getsitelogo`}
              alt={`Logo for project: ${context.project.title}'`}
              onLoad={props.onImageLoad}
            />
          </Link>

        </div>
      </CardPreview>
      <CardHeader
        header={
          <Link href={context.project.url} target='_blank' className={styles.link}>
            <Text
              className={styles.projectTitle}
              title={context.project.title}
              weight={'semibold'}
              wrap={false}
              size={400}
              truncate
              block
            >
              {context.project.title}
            </Text>
          </Link>
        }
      />
    </>
  )
}
