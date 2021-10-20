import { Web } from '@pnp/sp'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Link } from 'office-ui-fabric-react/lib/Link'
import { DirectionalHint, TooltipHost } from 'office-ui-fabric-react/lib/Tooltip'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationTooltip } from 'pp365-projectwebparts/lib/components/ProjectInformationTooltip'
import React, { FunctionComponent } from 'react'
import { ITitleColumnProps } from './types'

export const TitleColumn: FunctionComponent<ITitleColumnProps> = ({ item, props }) => {
  let content = (
    <span>
      <span>{item.Title}</span>
      <TooltipHost content={strings.NoProjectData} directionalHint={DirectionalHint.bottomAutoEdge}>
        <Icon
          iconName='ReportWarning'
          style={{ color: '666666', marginLeft: 4, position: 'relative', top: '2px' }}
        />
      </TooltipHost>
    </span>
  )
  if (item.Path) {
    content = (
      <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
        {item.Title}
      </Link>
    )
  }
  return (
    <ProjectInformationTooltip
      key={item.SiteId}
      title={item.Title}
      siteId={item.SiteId}
      webUrl={props.pageContext.site.absoluteUrl}
      hubSite={{
        web: new Web(props.pageContext.site.absoluteUrl),
        url: props.pageContext.site.absoluteUrl
      }}
      page='Portfolio'>
      {content}
    </ProjectInformationTooltip>
  )
}
