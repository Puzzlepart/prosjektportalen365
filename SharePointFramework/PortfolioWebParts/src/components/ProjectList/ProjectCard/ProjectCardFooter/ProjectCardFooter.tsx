import {
  Avatar,
  Button,
  CardFooter,
  Tooltip,
  useRestoreFocusTarget
} from '@fluentui/react-components'
import {
  PanelRightContractFilled,
  PanelRightContractRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { format } from 'pp365-shared-library'
import React, { FC, useContext } from 'react'
import { ProjectMenu } from '../../ProjectMenu'
import { ProjectCardContext } from '../context'
import styles from './ProjectCardFooter.module.scss'
import { useProjectCardFooter } from './useProjectCardFooter'
const PanelRight = bundleIcon(PanelRightContractFilled, PanelRightContractRegular)

export const ProjectCardFooter: FC = () => {
  const context = useContext(ProjectCardContext)
  const { primaryUser, secondaryUser, ProjectTypeIcon, projectTypeText } = useProjectCardFooter()
  // The project information panel opens from state, so its drawer has no trigger of Fluent's to
  // give the focus back to: the button is marked as its restore target (WCAG 2.4.3).
  const restoreFocusTarget = useRestoreFocusTarget()

  return (
    <CardFooter
      className={styles.footer}
      action={context.actions.map((action) => (
        // The tooltip names the button: with the same text as its title too, it was read twice.
        <Tooltip
          key={action.id}
          content={strings.ProjectInformationPanelButton}
          relationship='label'
          withArrow
        >
          <Button
            className={styles.action}
            appearance='subtle'
            icon={<PanelRight />}
            {...restoreFocusTarget}
            {...action}
          />
        </Tooltip>
      ))}
    >
      <div className={styles.persona}>
        <div hidden={!context.shouldDisplay('PrimaryUserField')}>
          {/* The picture is named by the role and the name, which the tooltip shows the pointer, and
              the keyboard too: what shows only in a tooltip takes the focus (WCAG 2.1.1). */}
          <Tooltip
            content={
              <>
                <strong>{primaryUser.role}</strong>: {primaryUser.name}
              </>
            }
            relationship='inaccessible'
            withArrow
          >
            <Avatar className={styles.avatar} tabIndex={0} {...primaryUser.avatar} />
          </Tooltip>
        </div>
        <div hidden={!context.shouldDisplay('SecondaryUserField')}>
          <Tooltip
            content={
              <>
                <strong>{secondaryUser.role}</strong>: {secondaryUser.name}
              </>
            }
            relationship='inaccessible'
            withArrow
          >
            <Avatar className={styles.avatar} tabIndex={0} {...secondaryUser.avatar} />
          </Tooltip>
        </div>
      </div>
      <div className={styles.buttons}>
        <Tooltip
          content={
            <>
              <strong>{projectTypeText}</strong> ({context.project?.template})
            </>
          }
          relationship='inaccessible'
          withArrow
        >
          {/* An image named by the type, where a button did nothing (WCAG 4.1.2). */}
          <span
            className={styles.templateTag}
            role='img'
            tabIndex={0}
            aria-label={format(
              strings.ProjectTypeIconLabel,
              projectTypeText,
              context.project?.template
            )}
          >
            <ProjectTypeIcon />
          </span>
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
