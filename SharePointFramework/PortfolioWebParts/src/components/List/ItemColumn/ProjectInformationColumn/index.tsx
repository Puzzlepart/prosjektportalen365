import strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { ColumnRenderComponent } from '../types'
import { Icon, Link } from '@fluentui/react'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { ListContext } from '../../context'
import { IProjectInformationColumnProps } from './types'

export const ProjectInformationColumn: ColumnRenderComponent<IProjectInformationColumnProps> = (props) => {
  const context = useContext(ListContext)
  return (
    <ProjectInformationPanel
      key={props.item.SiteId}
      title={props.columnValue}
      siteId={props.item.SiteId}
      webUrl={props.item.Path}
      page={props.page}
      hideAllActions={true}
      webPartContext={context.props.webPartContext}
      onRenderToggleElement={(onToggle) => (
        <Icon
          iconName={props.iconName}
          style={props.iconStyles}
          onClick={onToggle}
        />
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
  },
}
ProjectInformationColumn.key = 'projectinformationmodal'
ProjectInformationColumn.id = 'projectinformationmodal'
ProjectInformationColumn.displayName = strings.ColumnRenderOptionProjectInformationModal
ProjectInformationColumn.iconName = 'Info'