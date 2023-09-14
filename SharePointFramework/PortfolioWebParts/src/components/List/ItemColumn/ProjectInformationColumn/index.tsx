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
  const siteContext = SiteContext.create(
    context.props.webPartContext,
    props.item.SiteId,
    props.item.Path
  )
  return (
    <ProjectInformationPanel
      {...siteContext}
      title={props.columnValue}
      page={props.page}
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
      <Link href={props.item.Path} rel='noopener noreferrer' target='_blank'>
        {props.columnValue}
      </Link>
    </ProjectInformationPanel>
  )
}

ProjectInformationColumn.defaultProps = {
  page: 'Portfolio'
}
ProjectInformationColumn.key = 'projectinformationmodal'
ProjectInformationColumn.id = 'projectinformationmodal'
ProjectInformationColumn.displayName = strings.ColumnRenderOptionProjectInformationModal
ProjectInformationColumn.iconName = 'Info'
