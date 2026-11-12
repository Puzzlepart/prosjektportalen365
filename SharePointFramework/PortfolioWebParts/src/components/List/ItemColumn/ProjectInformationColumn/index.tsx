import strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformation'
import { ColumnRenderComponent, SiteContext, withDefaults } from 'pp365-shared-library'
import React, { useContext } from 'react'
import { ListContext } from '../../context'
import styles from '../TitleColumn/TitleColumn.module.scss'
import { IProjectInformationColumnProps } from './types'
import {
  bundleIcon,
  PanelRightContractFilled,
  PanelRightContractRegular
} from '@fluentui/react-icons'
import { Button, Link } from '@fluentui/react-components'

const Icons = {
  PanelRight: bundleIcon(PanelRightContractFilled, PanelRightContractRegular)
}

const PROJECT_INFORMATION_COLUMN_DEFAULT_PROPS: Partial<IProjectInformationColumnProps> = {
  page: 'Portfolio'
}

/** Show a project link beside a button opening its information panel. */
export const ProjectInformationColumn: ColumnRenderComponent<IProjectInformationColumnProps> = (
  incomingProps
) => {
  const props = withDefaults(incomingProps, PROJECT_INFORMATION_COLUMN_DEFAULT_PROPS)
  const context = useContext(ListContext)
  const url = props.item?.Path || props.item?.SPWebUrl

  return (
    <div className={styles.root}>
      <ProjectInformationPanel
        {...SiteContext.create(context.props.webPartContext, props.item.SiteId, url)}
        page={props.page}
        hideAllActions={true}
        panelProps={{
          headerText: props.columnValue
        }}
        onRenderToggleElement={(onToggle) => (
          <Button
            className={styles.action}
            appearance='transparent'
            size='small'
            icon={<Icons.PanelRight />}
            title={strings.ProjectInformationPanelButton}
            aria-label={strings.ProjectInformationPanelButton}
            onClick={onToggle}
          />
        )}
      >
        <Link
          className={styles.title}
          title={props.columnValue}
          href={url}
          rel='noopener noreferrer'
          target='_blank'
        >
          {props.columnValue}
        </Link>
      </ProjectInformationPanel>
    </div>
  )
}
ProjectInformationColumn.key = 'projectinfo'
ProjectInformationColumn.id = 'projectinfo'
ProjectInformationColumn.displayName = strings.ColumnRenderOptionProjectInfo
ProjectInformationColumn.iconName = 'Info'
