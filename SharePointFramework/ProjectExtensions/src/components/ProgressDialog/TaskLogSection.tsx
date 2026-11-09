import React, { FC, useEffect, useRef, useState } from 'react'
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
import { format, getUILocale } from 'pp365-shared-library'
import { ITaskProgress, TaskStatus, LogLevel } from './types'
import styles from './ProgressDialog.module.scss'

interface ITaskLogSectionProps {
  tasks: ITaskProgress[]
}

/** A step's status in words, which its icon and colour show to the eye alone (WCAG 1.4.1). */
const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  pending: strings.ProgressTaskStatusPending,
  running: strings.ProgressTaskStatusRunning,
  completed: strings.ProgressTaskStatusCompleted,
  error: strings.ProgressTaskStatusError,
  warning: strings.ProgressTaskStatusWarning
}

/** A log entry's level in words, for the icon that shows it. */
const LOG_LEVEL_TEXT: Record<LogLevel, string> = {
  info: strings.ProgressLogLevelInfo,
  warning: strings.ProgressLogLevelWarning,
  error: strings.ProgressLogLevelError
}

const getTaskStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'running':
      return <Spinner size='tiny' aria-hidden />
    // Fluent's status colours, 3:1 at least against the dialog (WCAG 1.4.11): the warning's
    // #ffaa44 was 1.9:1 and the pending circle's #8a8886 3.5:1.
    case 'completed':
      return (
        <CheckmarkCircleFilled
          style={{ color: 'var(--colorPaletteGreenForeground1)', fontSize: 16 }}
        />
      )
    case 'error':
      return (
        <ErrorCircleFilled style={{ color: 'var(--colorPaletteRedForeground1)', fontSize: 16 }} />
      )
    case 'warning':
      return (
        <WarningFilled
          style={{ color: 'var(--colorPaletteDarkOrangeForeground1)', fontSize: 16 }}
        />
      )
    case 'pending':
    default:
      return <CircleRegular style={{ color: 'var(--colorNeutralForeground3)', fontSize: 16 }} />
  }
}

const getLogLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'error':
      return (
        <ErrorCircleFilled style={{ color: 'var(--colorPaletteRedForeground1)', fontSize: 12 }} />
      )
    case 'warning':
      return (
        <WarningFilled
          style={{ color: 'var(--colorPaletteDarkOrangeForeground1)', fontSize: 12 }}
        />
      )
    case 'info':
    default:
      return <InfoRegular style={{ color: 'var(--colorNeutralForeground3)', fontSize: 12 }} />
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

/**
 * A step's log: a `log` the keyboard can reach to scroll it (WCAG 2.1.1), named by the step, each
 * entry's level named for its icon.
 */
const TaskLogEntries: FC<{ task: ITaskProgress }> = ({ task }) => {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [task.entries.length])

  return (
    <div ref={logRef} className={styles.logEntries} role='log' tabIndex={0} aria-label={task.name}>
      {task.entries.map((entry, idx) => (
        <div key={idx} className={styles.logEntry}>
          <span
            className={styles.logEntryIcon}
            role='img'
            aria-label={LOG_LEVEL_TEXT[entry.level] ?? LOG_LEVEL_TEXT.info}
          >
            {getLogLevelIcon(entry.level)}
          </span>
          <span className={styles.logEntryTime}>
            {entry.timestamp.toLocaleTimeString(getUILocale(), {
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
        <Text size={200} className={styles.pendingText}>
          {strings.ProgressTaskPendingText}
        </Text>
      )}
    </div>
  )
}

export const TaskLogSection: FC<ITaskLogSectionProps> = ({ tasks }) => {
  const [openItems, setOpenItems] = useState<string[]>([])
  const prevStatuses = useRef<Record<string, TaskStatus>>({})

  useEffect(() => {
    const autoOpen: string[] = []
    const autoClose: string[] = []
    tasks.forEach((task) => {
      const prevStatus = prevStatuses.current[task.name]
      if (task.status !== prevStatus) {
        if (task.status === 'running' || task.status === 'error') {
          autoOpen.push(task.name)
        } else if (prevStatus === 'running') {
          autoClose.push(task.name)
        }
      }
      prevStatuses.current[task.name] = task.status
    })
    if (autoOpen.length > 0 || autoClose.length > 0) {
      setOpenItems((items) => [
        ...items.filter((item) => !autoClose.includes(item)),
        ...autoOpen.filter((item) => !items.includes(item))
      ])
    }
  }, [tasks.map((t) => `${t.name}:${t.status}`).join(',')])

  return (
    <div className={styles.taskLogSection}>
      <Accordion
        collapsible
        multiple
        openItems={openItems}
        onToggle={(_, data) => setOpenItems(data.openItems as string[])}
      >
        {tasks.map((task) => (
          <AccordionItem key={task.name} value={task.name}>
            <AccordionHeader
              size='small'
              // Named by the step, its status and its entries, which the icon and the badge show.
              button={{
                'aria-label':
                  task.entries.length > 0
                    ? format(
                        strings.ProgressTaskLabelWithEntries,
                        task.name,
                        TASK_STATUS_TEXT[task.status],
                        task.entries.length
                      )
                    : format(strings.ProgressTaskLabel, task.name, TASK_STATUS_TEXT[task.status])
              }}
            >
              <span className={styles.taskHeader}>
                <span className={styles.taskStatusIcon} aria-hidden>
                  {getTaskStatusIcon(task.status)}
                </span>
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
