import { Icon, Link, TooltipHost } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import React, { FC } from 'react'
import { ITitleColumnProps } from './types'

export const TitleColumn: FC<ITitleColumnProps> = ({ item, props }) => {
  let content = (
    <span>
      <span>{item.Title}</span>
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
  if (item.Path && !props.isParentProject) {
    content = (
      <div>
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
          )}>
          <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
            {item.Title}
          </Link>
        </ProjectInformationPanel>
      </div>
    )
  } else if (item.Path && props.isParentProject) {
    content = (
      <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
        {item.Title}
      </Link>
    )
  }
  return content
}
