import React, { FC, useContext } from 'react'
import styles from './ProjectCardContent.module.scss'
import { GlobeLocationFilled, TagMultipleFilled } from '@fluentui/react-icons'
import { ProjectCardContext } from '../context'
import { OverflowTagMenu } from 'pp365-shared-library'

export const ProjectCardContent: FC = () => {
  const context = useContext(ProjectCardContext)

  return (
    <div className={styles.content}>
      <OverflowTagMenu
        text='Tjenesteområde'
        tags={context.project.serviceArea}
        icon={GlobeLocationFilled}
        hidden={!context.shouldDisplay('ProjectServiceArea')}
      />
      <OverflowTagMenu
        text='Prosjekttype'
        tags={context.project.type}
        icon={TagMultipleFilled}
        hidden={!context.shouldDisplay('ProjectType')}
      />
    </div>
  )
}
