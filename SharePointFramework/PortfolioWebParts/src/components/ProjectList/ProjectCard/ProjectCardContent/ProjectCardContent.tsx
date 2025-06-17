import React, { FC } from 'react'
import styles from './ProjectCardContent.module.scss'
import { GlobeLocationFilled, TagMultipleFilled } from '@fluentui/react-icons'
import { OverflowTagMenu } from 'pp365-shared-library'
import { useProjectCardContent } from './useProjectCardContent'

export const ProjectCardContent: FC = () => {
  const { primaryField, secondaryField, shouldDisplay } = useProjectCardContent()

  return (
    <div className={styles.content}>
      <OverflowTagMenu
        text={primaryField?.text}
        tags={primaryField?.tags}
        icon={GlobeLocationFilled}
        hidden={!shouldDisplay('PrimaryField') || !primaryField?.tags}
      />
      <OverflowTagMenu
        text={secondaryField?.text}
        tags={secondaryField?.tags}
        icon={TagMultipleFilled}
        hidden={!shouldDisplay('SecondaryField') || !secondaryField?.tags}
      />
    </div>
  )
}
