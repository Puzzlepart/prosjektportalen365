import strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { ColumnRenderComponent } from '../types'
import { Icon, Link } from '@fluentui/react'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { ListContext } from '../../context'
import { IProjectInformationColumnProps } from './types'
import styles from './ProjectInformationColumn.module.scss'

export const ProjectInformationColumn: ColumnRenderComponent<IProjectInformationColumnProps> = (
  props
) => {
  const context = useContext(ListContext)
  return (
    <div className={styles.root}>
      <ProjectInformationPanel
        title={props.columnValue}
        page={props.page}
        hideAllActions={true}
        dataAdapterParams={{
          spfxContext: context.props.webPartContext,
          configuration: {
            siteId: props.item.SiteId,
            webUrl: props.item.Path,
          }
        }}
        onRenderToggleElement={(onToggle) => (
          <Icon iconName={props.iconName} className={styles.icon} onClick={onToggle} />
        )}
      >
        <Link href={props.item.SPWebURL} rel='noopener noreferrer' target='_blank'>
          {props.columnValue}
        </Link>
      </ProjectInformationPanel>
    </div>
  )
}

ProjectInformationColumn.defaultProps = {
  page: 'Portfolio',
  iconName: 'Info'
}
ProjectInformationColumn.key = 'projectinformationmodal'
ProjectInformationColumn.id = 'projectinformationmodal'
ProjectInformationColumn.displayName = strings.ColumnRenderOptionProjectInformationModal
ProjectInformationColumn.iconName = 'Info'
