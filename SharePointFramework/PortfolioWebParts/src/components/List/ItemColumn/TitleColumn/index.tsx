import { Icon, Link, TooltipHost } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import React, { FC, useContext } from 'react'
import { ITitleColumnProps } from './types'
import { ListContext } from '../../context'
import styles from './TitleColumn.module.scss'

export const TitleColumn: FC<ITitleColumnProps> = (props) => {
  const context = useContext(ListContext)
  const link = (
    <Link href={props.item.Path} rel='noopener noreferrer' target='_blank'>
      {props.item.Title}
    </Link>
  )
  if (!props.item.Path) {
    return (
      <div className={styles.root}>
        <span>{props.item.Title}</span>
        <TooltipHost content={strings.NoProjectData}>
          <Icon
            iconName='Hide'
            className={styles.icon}
          />
        </TooltipHost>
      </div>
    )
  }
  if (!context.props.renderTitleProjectInformationPanel) {
    return link
  } else {
    return (
      <div className={styles.root}>
        <ProjectInformationPanel
          title={props.item.Title}
          dataAdapterParams={{
            spfxContext: context.props.webPartContext,
            configuration: {
              siteId: props.item.SiteId,
              webUrl: props.item.Path,
            }
          }}
          page='Portfolio'
          hideAllActions={true}
          webPartContext={context.props.webPartContext}
          onRenderToggleElement={(onToggle) => (
            <Icon
              iconName='Info'
              className={`${styles.icon} ${styles.toggle}`}
              onClick={onToggle}
            />
          )}
        >
          {link}
        </ProjectInformationPanel>
      </div>
    )
  }
}
