import { Icon, Link, TooltipHost } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import React, { FC } from 'react'
import { ITitleColumnProps } from './types'
import styles from './TitleColumn.module.scss'

export const TitleColumn: FC<ITitleColumnProps> = ({ item, props }) => {
  const link = (
    <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
      {item.Title}
    </Link>
  )


  let content = (
    <div className={styles.root}>
      <span>{item.Title}</span>
      <TooltipHost content={strings.NoProjectData}>
        <Icon
          iconName='Hide'
          className={styles.icon}
        />
      </TooltipHost>
    </div>
  )
  if (item.Path && !props.isParentProject) {
    content = (
      <div className={styles.root}>
        <ProjectInformationPanel
          key={item.SiteId}
          title={item.Title}
          siteId={item.SiteId}
          webUrl={item.Path}
          page='Portfolio'
          hideAllActions={true}
          webPartContext={props.webPartContext}
          onRenderToggleElement={(onToggle) => (
            <Icon
              iconName='Info'
              className={`${styles.icon} ${styles.toggle}`}
              onClick={onToggle}
            />
          )}>
          {link}
        </ProjectInformationPanel>
      </div>
    )
  } else if (item.Path && props.isParentProject) {
    content = (
      <div className={styles.root}>
        {link}
      </div>
    )
  }
  return content
}
