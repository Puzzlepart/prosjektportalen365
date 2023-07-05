import { Icon, Link } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import React from 'react'
import { IPortfolioAggregationProps } from './types'

/**
 * Get default columns that should be included if the property `lockedColumns` is not
 * set to `true` in the web part properties, or if the data source level is set to
 * `Prosjekt`.
 *
 * @param props Props
 */
export const getDefaultColumns = (props: IPortfolioAggregationProps) => {
  if (props.lockedColumns || props.dataSourceLevel === 'Prosjekt') return []
  return [
    {
      key: 'SiteTitle',
      idx: 0,
      fieldName: 'SiteTitle',
      name: strings.SiteTitleLabel,
      minWidth: 150,
      maxWidth: 225,
      isResizable: true,
      onRender: (item: any) => {
        return (
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
            )}
          >
            <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
              {item.SiteTitle}
            </Link>
          </ProjectInformationPanel>
        )
      },
      data: { isGroupable: true }
    }
  ]
}
