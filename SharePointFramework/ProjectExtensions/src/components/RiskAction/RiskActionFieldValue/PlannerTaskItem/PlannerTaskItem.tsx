import { Button, Popover, PopoverSurface, PopoverTrigger, mergeClasses, Persona } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './PlannerTaskItem.module.scss'
import { IPlannerTaskItemProps } from './types'
import { usePlannerTaskItem } from './usePlannerTaskItem'
import { PlannerTaskItemProperty } from './PlannerTaskItemProperty'

/**
 * Creates a link to a planner task in the Office tasks app.
 *
 * @param id - The ID of the task.
 * @param type - The type of the task link. Default value is 'TaskLink'.
 * @param channel - The channel of the task link. Default value is 'Link'.
 *
 * @returns The link to the planner task.
 */
function createPlannerTaskLink(id: string, type = 'TaskLink', channel = 'Link') {
  return `https://tasks.office.com/puzzlepart.onmicrosoft.com/home/task/${id}?type=${type}&channel=${channel}`
}

export const PlannerTaskItem: FC<IPlannerTaskItemProps> = (props) => {
  const { onOpenChange, task } = usePlannerTaskItem(props)
  return (
    <div className={styles.plannerTaskItem}>
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger>
          <div className={mergeClasses(styles.text, props.task.isCompleted === '1' && styles.isCompleted)}>
            {props.task.title}
          </div>
        </PopoverTrigger>
        <PopoverSurface>
          <div className={styles.plannerTaskPreview}>
            <div className={styles.title}>{props.task.title}</div>
            <PlannerTaskItemProperty value={task?.description} />
            <PlannerTaskItemProperty
              label='Startdato'
              value={task?.startDateTime?.toLocaleDateString()} />
            <PlannerTaskItemProperty
              label='Forfallsdato'
              value={task?.dueDateTime?.toLocaleDateString()} />
            <PlannerTaskItemProperty
              label='Fremdrift'
              value={task?.progress} />
            <PlannerTaskItemProperty label='Tilordnet til'>
              {task?.assignees.map((assignee) => (
                <div>
                  <Persona
                    name={assignee.displayName}
                    avatar={{
                      image: {
                        src: `/_layouts/15/userphoto.aspx?size=S&username=${assignee.mail}`,
                      }
                    }}
                  />
                </div>
              ))}
            </PlannerTaskItemProperty>
            {props.task.isCompleted === '1' && (
              <div className={styles.completedText}>
                {getFluentIcon('CheckmarkCircle', { color: 'green' })}
                <span>{strings.RiskActionPlannerTaskPreviewCompletedText}</span>
              </div>
            )}
            <Button
              onClick={() => window.open(createPlannerTaskLink(props.task.id), '_blank')}
              appearance='subtle'
              icon={getFluentIcon('ClipboardTask')}>
              {strings.RiskActionPlannerTaskPreviewPlannerLinkText}
            </Button>
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  )
}
