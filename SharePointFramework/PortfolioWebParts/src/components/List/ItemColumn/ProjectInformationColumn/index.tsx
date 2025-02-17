import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { SiteContext } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ListContext } from '../../context'
import { ColumnRenderComponent } from '../types'
import { IProjectInformationColumnProps } from './types'
import {
  bundleIcon,
  PanelRightContractFilled,
  PanelRightContractRegular
} from '@fluentui/react-icons'
import { Button, Link, Tooltip } from '@fluentui/react-components'

/**
 * Object containing icons used in the component.
 */
const Icons = {
  PanelRight: bundleIcon(PanelRightContractFilled, PanelRightContractRegular)
}

export const ProjectInformationColumn: ColumnRenderComponent<IProjectInformationColumnProps> = (
  props
) => {
  const context = useContext(ListContext)
  const url = props.item?.Path || props.item?.SPWebUrl

  return (
    <ProjectInformationPanel
      {...SiteContext.create(context.props.webPartContext, props.item.SiteId, url)}
      page={props.page}
      hideAllActions={true}
      panelProps={{
        headerText: props.columnValue
      }}
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
      <Link href={url} rel='noopener noreferrer' target='_blank'>
        {props.columnValue}
      </Link>
    </ProjectInformationPanel>
  )
}

ProjectInformationColumn.defaultProps = {
  page: 'Portfolio'
}
ProjectInformationColumn.key = 'projectinfo'
ProjectInformationColumn.id = 'projectinfo'
ProjectInformationColumn.displayName = strings.ColumnRenderOptionProjectInfo
ProjectInformationColumn.iconName = 'Info'
