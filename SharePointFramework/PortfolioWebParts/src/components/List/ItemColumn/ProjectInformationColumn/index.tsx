import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { ColumnRenderComponent, SiteContext } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ListContext } from '../../context'
import { IProjectInformationColumnProps } from './types'
import {
  bundleIcon,
  PanelRightContractFilled,
  PanelRightContractRegular
} from '@fluentui/react-icons'
import { Button, Link } from '@fluentui/react-components'

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
        <Button
          appearance='transparent'
          size='small'
          icon={<Icons.PanelRight />}
          title={strings.ProjectInformationPanelButton}
          aria-label={strings.ProjectInformationPanelButton}
          onClick={onToggle}
        />
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
