import { Web } from '@pnp/sp'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Link } from 'office-ui-fabric-react/lib/Link'
import { TooltipHost } from 'office-ui-fabric-react/lib/Tooltip'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationTooltip } from 'pp365-projectwebparts/lib/components/ProjectInformationTooltip'
import React, { FunctionComponent } from 'react'
import { ITitleColumnProps } from './types'

export const TitleColumn: FunctionComponent<ITitleColumnProps> = ({ item, props }) => {
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
      <ProjectInformationTooltip
        key={item.SiteId}
        title={item.Title}
        siteId={item.SiteId}
        webUrl={item.Path}
        hubSite={{
          web: new Web(props.pageContext.site.absoluteUrl),
          url: props.pageContext.site.absoluteUrl
        }}
        page='Portfolio'>
        <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
          {item.Title}
        </Link>
      </ProjectInformationTooltip>
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
