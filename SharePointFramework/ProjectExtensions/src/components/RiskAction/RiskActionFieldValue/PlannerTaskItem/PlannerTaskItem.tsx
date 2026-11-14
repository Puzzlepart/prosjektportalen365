import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  mergeClasses,
  Persona
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { formatShortDate, getFluentIcon } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './PlannerTaskItem.module.scss'
import { IPlannerTaskItemProps } from './types'
import { usePlannerTaskItem } from './usePlannerTaskItem'
import { PlannerTaskItemProperty } from './PlannerTaskItemProperty'

/** Opens a named, focus-trapping preview for a risk's Planner task and indicates completion. */
export const PlannerTaskItem: FC<IPlannerTaskItemProps> = (props) => {
  const { onOpenChange, task, taskLink, titleId, isCompleted, label, focusContent } =
    usePlannerTaskItem(props)
  return (
    <div className={styles.plannerTaskItem} role='listitem'>
      <Popover onOpenChange={onOpenChange} trapFocus>
        <PopoverTrigger>
          <div
            className={mergeClasses(styles.text, isCompleted && styles.isCompleted)}
            // Struck through to the eye; said in words to a screen reader (WCAG 1.3.1).
            aria-label={label}
          >
            {props.task.title}
          </div>
        </PopoverTrigger>
        <PopoverSurface {...focusContent} aria-labelledby={titleId}>
          <div className={styles.plannerTaskPreview}>
            <div className={styles.title} id={titleId}>
              {props.task.title}
            </div>
            {task?.description && <p className={styles.description}>{task.description}</p>}
            <dl className={styles.properties}>
              <PlannerTaskItemProperty
                label={strings.StartDateLabel}
                value={formatShortDate(task?.startDateTime)}
              />
              <PlannerTaskItemProperty
                label={strings.DueDateLabel}
                value={formatShortDate(task?.dueDateTime)}
              />
              <PlannerTaskItemProperty label={strings.ProgressLabel} value={task?.progress} />
              <PlannerTaskItemProperty label={strings.AssignedToLabel}>
                {task?.assignees.map((assignee) => (
                  <div key={assignee.displayName}>
                    {/* The picture beside the name it shows, or the name is read twice. */}
                    <Persona
                      name={assignee.displayName}
                      avatar={{
                        'aria-hidden': true,
                        image: {
                          src: `/_layouts/15/userphoto.aspx?size=S&username=${assignee.mail}`
                        }
                      }}
                    />
                  </div>
                ))}
              </PlannerTaskItemProperty>
            </dl>
            {isCompleted && (
              <div className={styles.completedText}>
                {getFluentIcon('CheckmarkCircle', { color: 'green' })}
                <span>{strings.RiskActionPlannerTaskPreviewCompletedText}</span>
              </div>
            )}
            <Button
              as='a'
              href={taskLink}
              target='_blank'
              rel='noopener noreferrer'
              appearance='subtle'
              icon={getFluentIcon('ClipboardTask')}
            >
              {strings.RiskActionPlannerTaskPreviewPlannerLinkText}
            </Button>
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  )
}
