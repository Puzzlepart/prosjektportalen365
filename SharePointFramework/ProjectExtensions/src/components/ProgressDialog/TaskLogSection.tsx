import React, { FC, useEffect, useMemo, useRef } from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Text,
  Badge,
  Spinner
} from '@fluentui/react-components'
import {
  CheckmarkCircleFilled,
  ErrorCircleFilled,
  WarningFilled,
  CircleRegular,
  InfoRegular
} from '@fluentui/react-icons'
import strings from 'ProjectExtensionsStrings'
import { ITaskProgress, TaskStatus, LogLevel } from './types'
import styles from './ProgressDialog.module.scss'

interface ITaskLogSectionProps {
  tasks: ITaskProgress[]
}

const getTaskStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'running':
      return <Spinner size='tiny' />
    case 'completed':
      return <CheckmarkCircleFilled style={{ color: '#107c10', fontSize: 16 }} />
    case 'error':
      return <ErrorCircleFilled style={{ color: '#d13438', fontSize: 16 }} />
    case 'warning':
      return <WarningFilled style={{ color: '#ffaa44', fontSize: 16 }} />
    case 'pending':
    default:
      return <CircleRegular style={{ color: '#8a8886', fontSize: 16 }} />
  }
}

const getLogLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'error':
      return <ErrorCircleFilled style={{ color: '#d13438', fontSize: 12 }} />
    case 'warning':
      return <WarningFilled style={{ color: '#ffaa44', fontSize: 12 }} />
    case 'info':
    default:
      return <InfoRegular style={{ color: '#8a8886', fontSize: 12 }} />
  }
}

const getLogEntryColor = (level: LogLevel): string => {
  switch (level) {
    case 'error':
      return '#d13438'
    case 'warning':
      return '#8a6914'
    default:
      return '#323130'
  }
}

const TaskLogEntries: FC<{ task: ITaskProgress }> = ({ task }) => {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [task.entries.length])

  return (
    <div ref={logRef} className={styles.logEntries}>
      {task.entries.map((entry, idx) => (
        <div key={idx} className={styles.logEntry}>
          <span className={styles.logEntryIcon}>{getLogLevelIcon(entry.level)}</span>
          <span className={styles.logEntryTime}>
            {entry.timestamp.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
          <span className={styles.logEntryMessage} style={{ color: getLogEntryColor(entry.level) }}>
            {entry.message}
          </span>
        </div>
      ))}
      {task.entries.length === 0 && task.status === 'pending' && (
        <Text size={200} style={{ color: '#8a8886', fontStyle: 'italic' }}>
          {strings.ProgressTaskPendingText}
        </Text>
      )}
    </div>
  )
}

export const TaskLogSection: FC<ITaskLogSectionProps> = ({ tasks }) => {
  const openItems = useMemo(
    () => tasks.filter((t) => t.status === 'running' || t.status === 'error').map((t) => t.name),
    [tasks.map((t) => `${t.name}:${t.status}`).join(',')]
  )

  return (
    <div className={styles.taskLogSection}>
      <Accordion collapsible multiple openItems={openItems}>
        {tasks.map((task) => (
          <AccordionItem key={task.name} value={task.name}>
            <AccordionHeader size='small'>
              <span className={styles.taskHeader}>
                <span className={styles.taskStatusIcon}>{getTaskStatusIcon(task.status)}</span>
                <Text size={200} weight='semibold'>
                  {task.name}
                </Text>
                {task.entries.length > 0 && (
                  <Badge
                    appearance='tint'
                    color={task.status === 'error' ? 'danger' : 'informative'}
                    size='small'
                  >
                    {task.entries.length}
                  </Badge>
                )}
              </span>
            </AccordionHeader>
            <AccordionPanel>
              <TaskLogEntries task={task} />
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
