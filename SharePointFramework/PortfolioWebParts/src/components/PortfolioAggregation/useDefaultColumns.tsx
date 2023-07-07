import { Icon, Link } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import React, { useMemo } from 'react'
import { IPortfolioAggregationContext } from './context'

/**
 * Get default columns that should be included if the property `lockedColumns` is not
 * set to `true` in the web part properties, or if the data source level is set to
 * `Prosjekt`. An empty array is returned in these cases.
 *
 * In the future the `SiteTitle` column should be in the list _Prosjektinnholdskolonner_,
 * instead of hard coded here.
 *
 * @param props Props
 */
export function useDefaultColumns(context: IPortfolioAggregationContext) {
  if (context.props.lockedColumns || context.props.dataSourceLevel === 'Prosjekt') {
    return context.state.columns
  }
  return useMemo(
    () => [
      {
        key: 'SiteTitle',
        fieldName: 'SiteTitle',
        name: strings.SiteTitleLabel,
        minWidth: 150,
        maxWidth: 225,
        isResizable: true,
        onRender: (item: any) => (
          <ProjectInformationPanel
            key={item.SiteId}
            title={item.SiteTitle}
            siteId={item.SiteId}
            webUrl={item.Path}
            page='Portfolio'
            hideAllActions={true}
            webPartContext={context.props.webPartContext}
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
        ),
        data: { isGroupable: true }
      },
      ..._.filter([...context.state.columns], (c) => c.data?.isSelected)
    ],
    [context.state.columns]
  )
}
