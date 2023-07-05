import { Icon, Link, TooltipHost } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import React, { FC } from 'react'
import { ITitleColumnProps } from './types'

export const TitleColumn: FC<ITitleColumnProps> = (props) => {
  if (!props.item.Path) {
    return (
      <span>
        <span>{props.item.Title}</span>
        <TooltipHost content={strings.NoProjectData}>
          <Icon
            iconName='Hide'
            style={{
              color: '666666',
              marginLeft: 4,
              position: 'relative',
              top: '2px',
              fontSize: '1.1em'
            }}
          />
        </TooltipHost>
      </span>
    )
  }
  if (!props.renderProjectInformationPanel) {
    return (
      <Link href={props.item.Path} rel='noopener noreferrer' target='_blank'>
        {props.item.Title}
      </Link>
    )
  } else {
    return (
      <div>
        <ProjectInformationPanel
          key={props.item.SiteId}
          title={props.item.Title}
          siteId={props.item.SiteId}
          webUrl={props.item.Path}
          page='Portfolio'
          hideAllActions={true}
          webPartContext={props.webPartContext}
          onRenderToggleElement={(onToggle) => (
            <Icon
              iconName='Info'
              style={{
                color: '666666',
                marginLeft: 4,
                position: 'relative',
                top: '2px',
                fontSize: '1.1em',
                cursor: 'pointer'
              }}
              onClick={onToggle}
            />
          )}
        >
          <Link href={props.item.Path} rel='noopener noreferrer' target='_blank'>
            {props.item.Title}
          </Link>
        </ProjectInformationPanel>
      </div>
    )
  }
}
