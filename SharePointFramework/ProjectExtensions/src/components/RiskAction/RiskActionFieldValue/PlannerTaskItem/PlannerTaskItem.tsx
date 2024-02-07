import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  mergeClasses,
  Persona
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { getFluentIcon } from 'pp365-shared-library'
import React, { FC } from 'react'
import styles from './PlannerTaskItem.module.scss'
import { IPlannerTaskItemProps } from './types'
import { usePlannerTaskItem } from './usePlannerTaskItem'
import { PlannerTaskItemProperty } from './PlannerTaskItemProperty'

export const PlannerTaskItem: FC<IPlannerTaskItemProps> = (props) => {
  const { onOpenChange, task, taskLink } = usePlannerTaskItem(props)
  return (
    <div className={styles.plannerTaskItem}>
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger>
          <div
            className={mergeClasses(
              styles.text,
              props.task.isCompleted === '1' && styles.isCompleted
            )}
          >
            {props.task.title}
          </div>
        </PopoverTrigger>
        <PopoverSurface>
          <div className={styles.plannerTaskPreview}>
            <div className={styles.title}>{props.task.title}</div>
            <PlannerTaskItemProperty value={task?.description} />
            <PlannerTaskItemProperty
              label='Startdato'
              value={task?.startDateTime?.toLocaleDateString()}
            />
            <PlannerTaskItemProperty
              label='Forfallsdato'
              value={task?.dueDateTime?.toLocaleDateString()}
            />
            <PlannerTaskItemProperty label='Fremdrift' value={task?.progress} />
            <PlannerTaskItemProperty label='Tilordnet til'>
              {task?.assignees.map((assignee) => (
                <div key={assignee.displayName}>
                  <Persona
                    name={assignee.displayName}
                    avatar={{
                      image: {
                        src: `/_layouts/15/userphoto.aspx?size=S&username=${assignee.mail}`
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
              onClick={() => window.open(taskLink, '_blank')}
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
