import { format } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import { isEmpty } from 'underscore'
import { ProjectPhasesContext } from '../../context'
import { CHANGE_PHASE } from '../../reducer'
import styles from './ProjectPhasePopover.module.scss'
import { IProjectPhasePopoverProps } from './types'
import { Button, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import {
  bundleIcon,
  CheckboxArrowRightFilled,
  CheckboxArrowRightRegular,
  TaskListLtrFilled,
  TaskListLtrRegular
} from '@fluentui/react-icons'
import { customLightTheme } from 'pp365-shared-library'
import resources from 'SharedResources'

const Icons = {
  TaskList: bundleIcon(TaskListLtrFilled, TaskListLtrRegular),
  CheckboxArrowRight: bundleIcon(CheckboxArrowRightFilled, CheckboxArrowRightRegular)
}

export const ProjectPhasePopover: FC<IProjectPhasePopoverProps> = (props) => {
  const context = useContext(ProjectPhasesContext)
  const fluentProviderId = useId('fp-project-phase-popover')
  if (!props.target) return null
  const { phase } = props
  const stats = Object.keys(phase.checklistData.stats)
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <div className={styles.root}>
          <h2 className={styles.title}>{phase.name}</h2>
          <div className={styles.body}>
            <h4 className={styles.subText}>{phase.subText}</h4>
            <p>{phase.description}</p>
            <div>
              <div hidden={isEmpty(stats)}>
                {stats.map((status, idx) => (
                  <div key={idx}>
                    <ReactMarkdown>
                      {format(
                        strings.CheckPointsStatus,
                        phase.checklistData.stats[status],
                        status.toLowerCase()
                      )}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
              <div>
                {!isEmpty(phase.checklistData.items) && (
                  <Button
                    as='a'
                    appearance='subtle'
                    icon={<Icons.TaskList />}
                    title={strings.PhaseChecklistLinkText}
                    href={phase.getFilteredPhaseChecklistViewUrl(
                      `${context.props.webAbsoluteUrl}/${resources.Lists_PhaseChecklist_Url}`
                    )}
                  >
                    <span className={styles.label}>{strings.PhaseChecklistLinkText}</span>
                  </Button>
                )}
                {context.state.data.userHasChangePhasePermission && (
                  <Button
                    appearance='subtle'
                    icon={<Icons.CheckboxArrowRight />}
                    title={
                      phase.id === context.state.data?.currentPhase?.id
                        ? strings.Aria.CurrentPhaseText
                        : strings.ChangePhaseText
                    }
                    onClick={() => context.dispatch(CHANGE_PHASE())}
                    disabled={phase.id === context.state.data?.currentPhase?.id}
                  >
                    <span className={styles.label}>{strings.ChangePhaseText}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

export * from './types'
