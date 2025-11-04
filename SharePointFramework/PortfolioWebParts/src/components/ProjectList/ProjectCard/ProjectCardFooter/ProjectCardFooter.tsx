import { Avatar, Button, CardFooter, Tooltip } from '@fluentui/react-components'
import {
  PanelRightContractFilled,
  PanelRightContractRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectMenu } from '../../ProjectMenu'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardFooter.module.scss'
import { useProjectCardFooter } from './useProjectCardFooter'
const PanelRight = bundleIcon(PanelRightContractFilled, PanelRightContractRegular)

export const ProjectCardFooter: FC = () => {
  const context = useContext(ProjectCardContext)
  const { primaryUser, secondaryUser, ProjectTypeIcon, projectTypeText } = useProjectCardFooter()

  return (
    <CardFooter
      className={styles.footer}
      action={context.actions.map((action) => (
        <Tooltip
          key={action.id}
          content={<>{strings.ProjectInformationPanelButton}</>}
          relationship='description'
          withArrow
        >
          <Button className={styles.action} appearance='subtle' icon={<PanelRight />} {...action} />
        </Tooltip>
      ))}
    >
      <div className={styles.persona}>
        <div hidden={!context.shouldDisplay('PrimaryUserField')}>
          <Tooltip
            content={
              <>
                <strong>{primaryUser.role}</strong>: {primaryUser.name || strings.NotSet}
              </>
            }
            relationship='description'
            withArrow
          >
            <Avatar className={styles.avatar} {...primaryUser} />
          </Tooltip>
        </div>
        <div hidden={!context.shouldDisplay('SecondaryUserField')}>
          <Tooltip
            content={
              <>
                <strong>{secondaryUser.role}</strong>: {secondaryUser.name || strings.NotSet}
              </>
            }
            relationship='description'
            withArrow
          >
            <Avatar className={styles.avatar} {...secondaryUser} />
          </Tooltip>
        </div>
      </div>
      <div className={styles.buttons}>
        <Tooltip
          content={
            <>
              <strong>{projectTypeText}</strong> ({context.project.template})
            </>
          }
          relationship='description'
          withArrow
        >
          <Button
            className={styles.templateTag}
            appearance='subtle'
            icon={<ProjectTypeIcon />}
            title={context.project.template}
          />
        </Tooltip>
        <ProjectMenu
          project={context.project}
          context={context}
          appearance='subtle'
          disabled={!context.project || !context.project.url || context.project.url === '#'}
        />
      </div>
    </CardFooter>
  )
}
