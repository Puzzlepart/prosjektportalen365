import { Icon, Link } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { SiteContext } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ListContext } from '../../context'
import { ColumnRenderComponent } from '../types'
import { IProjectInformationColumnProps } from './types'

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
        <Icon iconName={props.iconName} style={props.iconStyles} onClick={onToggle} />
      )}
    >
      <Link href={props.item.SPWebURL} rel='noopener noreferrer' target='_blank'>
        {props.columnValue}
      </Link>
    </ProjectInformationPanel>
  )
}

ProjectInformationColumn.defaultProps = {
  page: 'Portfolio',
  iconName: 'Info',
  iconStyles: {
    color: '666666',
    marginLeft: 4,
    position: 'relative',
    top: '2px',
    fontSize: '1.1em',
    cursor: 'pointer'
  }
}
ProjectInformationColumn.key = 'projectinformationmodal'
ProjectInformationColumn.id = 'projectinformationmodal'
ProjectInformationColumn.displayName = strings.ColumnRenderOptionProjectInformationModal
ProjectInformationColumn.iconName = 'Info'
