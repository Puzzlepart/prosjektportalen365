import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { SiteContext } from 'pp365-shared-library'
import React, { FC, ReactNode, useContext } from 'react'
import { ListContext } from '../../context'
import { usePortfolioOverviewContext } from '../../../PortfolioOverview/context'
import { ITitleColumnProps } from './types'
import { Text, Button, Link, Tooltip } from '@fluentui/react-components'
import {
  bundleIcon,
  EyeOffFilled,
  EyeOffRegular,
  PanelRightContractFilled,
  PanelRightContractRegular
} from '@fluentui/react-icons'

/**
 * Object containing icons used in the component.
 */
const Icons = {
  EyeOff: bundleIcon(EyeOffFilled, EyeOffRegular),
  PanelRight: bundleIcon(PanelRightContractFilled, PanelRightContractRegular)
}

export const TitleColumn: FC<ITitleColumnProps> = (props) => {
  const context = useContext(ListContext)
  const portfolioOverviewContext = usePortfolioOverviewContext()
  const url = props.item?.Path || props.item?.SPWebUrl
  const isUserInPortfolioManagerGroup =
    portfolioOverviewContext?.state?.isUserInPortfolioManagerGroup ?? false
  const isParentProject = portfolioOverviewContext?.props?.isParentProject ?? false
  const showChildProjectInfoInProgram =
    portfolioOverviewContext?.state?.showChildProjectInfoInProgram ?? false
  const showPanelButtonWithoutUrl =
    isUserInPortfolioManagerGroup || (isParentProject && showChildProjectInfoInProgram)
  const renderProjectInformationPanel = context?.props?.renderTitleProjectInformationPanel

  /**
   * Renders the title wrapped in a `ProjectInformationPanel` with a toggle button.
   *
   * @param children Title element shown in the cell and used as the panel trigger label
   * @param webAbsoluteUrl Project web URL. Omitted for projects the user has no access to,
   * in which case the panel falls back to the current (hub) web context — so for those
   * projects it surfaces hub-side data only, not the project's own web data.
   */
  const renderPanel = (children: ReactNode, webAbsoluteUrl?: string) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <ProjectInformationPanel
        {...SiteContext.create(context.props.webPartContext, props.item.SiteId, webAbsoluteUrl)}
        title={props.item.Title}
        page='Portfolio'
        hideAllActions={true}
        onRenderToggleElement={(onToggle) => (
          <Tooltip
            content={<>{strings.ProjectInformationPanelButton}</>}
            relationship='description'
            withArrow
          >
            <Button
              appearance='transparent'
              size='small'
              icon={<Icons.PanelRight />}
              onClick={onToggle}
            />
          </Tooltip>
        )}
      >
        {children}
      </ProjectInformationPanel>
    </div>
  )

  if (!url) {
    if (renderProjectInformationPanel && showPanelButtonWithoutUrl) {
      return renderPanel(<Text size={200}>{props.item.Title}</Text>)
    }
    return (
      <span>
        <Text size={200}>{props.item.Title}</Text>
        <Tooltip content={strings.NoProjectData} relationship='label' withArrow>
          <Button
            style={{ cursor: 'default' }}
            appearance='transparent'
            size='small'
            icon={<Icons.EyeOff />}
          />
        </Tooltip>
      </span>
    )
  }
  if (!renderProjectInformationPanel) {
    return (
      <Link href={url} target='_blank' rel='noopener noreferrer'>
        {props.item.Title}
      </Link>
    )
  }
  return renderPanel(
    <Link href={url} rel='noopener noreferrer' target='_blank'>
      {props.item.Title}
    </Link>,
    url
  )
}
