import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  makeStyles,
  mergeClasses,
  ProgressBar,
  Spinner,
  Text,
  tokens,
  Tooltip
} from '@fluentui/react-components'
import {
  CheckmarkCircle24Filled,
  ChevronDown16Regular,
  ChevronUp16Regular,
  Circle24Regular,
  ErrorCircle16Filled,
  ErrorCircle24Filled,
  Info16Regular,
  SubtractCircle24Regular,
  Warning16Filled
} from '@fluentui/react-icons'
import { UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useRef, useState } from 'react'
import { IInstallLogEntry, InstallStepKey, InstallStepStatus } from 'models'
import { useCatalogContext } from '../context'
import styles from './InstallProgress.module.scss'

const useLogStyles = makeStyles({
  logSection: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS
  },
  log: {
    maxHeight: '260px',
    overflowY: 'auto'
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS
  },
  entry: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalXS,
    paddingLeft: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground2
  },
  entryIcon: {
    display: 'flex',
    flexShrink: 0,
    marginTop: '2px'
  },
  entryWarning: { color: tokens.colorPaletteDarkOrangeForeground1 },
  entryError: { color: tokens.colorPaletteRedForeground1 }
})

function stepLabel(key: InstallStepKey): string {
  switch (key) {
    case InstallStepKey.Download:
      return strings.CatalogStepDownload
    case InstallStepKey.Unzip:
      return strings.CatalogStepUnzip
    case InstallStepKey.ValidateManifest:
      return strings.CatalogStepValidateManifest
    case InstallStepKey.CheckVersion:
      return strings.CatalogStepCheckVersion
    case InstallStepKey.CheckCompatibility:
      return strings.CatalogStepCheckCompatibility
    case InstallStepKey.ProvisionHub:
      return strings.CatalogStepProvisionHub
    case InstallStepKey.Taxonomy:
      return strings.CatalogStepTaxonomy
    case InstallStepKey.StoreProjectTemplate:
      return strings.CatalogStepStoreProjectTemplate
    case InstallStepKey.Extensions:
      return strings.CatalogStepExtensions
    case InstallStepKey.Content:
      return strings.CatalogStepContent
    case InstallStepKey.ListContent:
      return strings.CatalogStepListContent
    case InstallStepKey.UpdateTemplateOptions:
      return strings.CatalogStepUpdateTemplateOptions
    default:
      return key
  }
}

function statusLabel(status: InstallStepStatus): string {
  switch (status) {
    case 'running':
      return strings.CatalogStepStatusRunning
    case 'done':
      return strings.CatalogStepStatusDone
    case 'error':
      return strings.CatalogStepStatusError
    case 'skipped':
      return strings.CatalogStepStatusSkipped
    default:
      return strings.CatalogStepStatusPending
  }
}

const StepIcon: FC<{ status: InstallStepStatus }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <Spinner size='tiny' />
    case 'done':
      return <CheckmarkCircle24Filled className={styles.successIcon} />
    case 'error':
      return <ErrorCircle24Filled className={styles.errorIcon} />
    case 'skipped':
      return <SubtractCircle24Regular className={styles.mutedIcon} />
    default:
      return <Circle24Regular className={styles.mutedIcon} />
  }
}

const logLevelIcon = (level: IInstallLogEntry['level']) => {
  switch (level) {
    case 'error':
      return <ErrorCircle16Filled />
    case 'warning':
      return <Warning16Filled />
    default:
      return <Info16Regular />
  }
}

export const InstallProgress: FC = () => {
  const { state, setState, selectedPackage, importPackage } = useCatalogContext()
  const cls = useLogStyles()
  // Advanced log is collapsed by default (like ProjectSetup); auto-expands on error.
  const [logExpanded, setLogExpanded] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const progress = state.installProgress
  const totalLogEntries = progress?.log?.length ?? 0
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [totalLogEntries])
  if (!progress) return null

  const isExtension = selectedPackage?.type === 'extension'

  if (progress.steps.length === 0) {
    return (
      <div className={styles.loading}>
        <Spinner label={strings.CatalogStepDownload} />
      </div>
    )
  }

  const total = progress.steps.length
  const completed = progress.steps.filter(
    (s) => s.status === 'done' || s.status === 'skipped'
  ).length
  const isTerminal = progress.status === 'success' || progress.status === 'error'

  // Group the advanced-log lines by type (handler / install phase), preserving
  // first-seen order — like ProjectSetup's advanced log.
  const logGroups: { name: string; entries: IInstallLogEntry[] }[] = []
  const groupIndex = new Map<string, number>()
  for (const entry of progress.log) {
    let index = groupIndex.get(entry.group)
    if (index === undefined) {
      index = logGroups.length
      groupIndex.set(entry.group, index)
      logGroups.push({ name: entry.group, entries: [] })
    }
    logGroups[index].entries.push(entry)
  }
  const activeGroup = progress.log.length
    ? progress.log[progress.log.length - 1].group
    : undefined
  const groupStatus = (group: { name: string; entries: IInstallLogEntry[] }): InstallStepStatus => {
    if (group.entries.some((e) => e.level === 'error')) return 'error'
    if (!isTerminal && group.name === activeGroup) return 'running'
    return 'done'
  }
  // While running: only the active (and any errored) group is expanded — so it
  // expands as provisioning enters it and collapses when the next begins. Once
  // finished, expand everything for review.
  const openLogItems = isTerminal
    ? logGroups.map((g) => g.name)
    : logGroups.filter((g) => groupStatus(g) !== 'done').map((g) => g.name)
  const hasLogError = logGroups.some((g) => g.entries.some((e) => e.level === 'error'))
  const isLogExpanded = logExpanded || hasLogError

  return (
    <div className={styles.root}>
      <ProgressBar value={completed / total} max={1} />
      <div className={styles.steps}>
        {progress.steps.map((step) => (
          <div key={step.key} className={styles.step}>
            <Tooltip content={statusLabel(step.status)} relationship='label'>
              <span className={styles.stepIcon}>
                <StepIcon status={step.status} />
              </span>
            </Tooltip>
            <div className={styles.stepText}>
              <Text>{stepLabel(step.key)}</Text>
              {step.detail && (
                <Text size={200} className={styles.detail}>
                  {step.detail}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>

      {logGroups.length > 0 && (
        <div className={cls.logSection}>
          <Button
            appearance='subtle'
            size='small'
            icon={isLogExpanded ? <ChevronUp16Regular /> : <ChevronDown16Regular />}
            onClick={() => setLogExpanded(!logExpanded)}
          >
            {strings.CatalogAdvancedLogLabel}
          </Button>
          {isLogExpanded && (
            <div ref={logRef} className={cls.log}>
              <Accordion multiple collapsible openItems={openLogItems}>
                {logGroups.map((group) => {
                  const status = groupStatus(group)
                  return (
                    <AccordionItem key={group.name} value={group.name}>
                      <AccordionHeader>
                        <span className={cls.groupHeader}>
                          <span className={styles.stepIcon}>
                            <StepIcon status={status} />
                          </span>
                          <Text size={200} weight='semibold'>
                            {group.name}
                          </Text>
                          <Badge
                            appearance='tint'
                            color={status === 'error' ? 'danger' : 'informative'}
                            size='small'
                          >
                            {group.entries.length}
                          </Badge>
                        </span>
                      </AccordionHeader>
                      <AccordionPanel>
                        {group.entries.map((entry, index) => (
                          <div
                            key={index}
                            className={mergeClasses(
                              cls.entry,
                              entry.level === 'warning' && cls.entryWarning,
                              entry.level === 'error' && cls.entryError
                            )}
                          >
                            <span className={cls.entryIcon}>{logLevelIcon(entry.level)}</span>
                            <Text size={200}>{entry.message}</Text>
                          </div>
                        ))}
                      </AccordionPanel>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          )}
        </div>
      )}

      {progress.status === 'success' && (
        <UserMessage
          intent='success'
          title={
            isExtension
              ? strings.CatalogInstallSuccessTitleExtension
              : strings.CatalogInstallSuccessTitle
          }
          text={
            isExtension
              ? strings.CatalogInstallSuccessTextExtension
              : strings.CatalogInstallSuccessText
          }
        />
      )}
      {progress.status === 'error' && (
        <>
          <UserMessage
            intent='error'
            title={strings.CatalogInstallErrorTitle}
            text={progress.error}
          />
          <Text size={200} className={styles.partialNote}>
            {strings.CatalogInstallErrorPartialNote}
          </Text>
        </>
      )}
      {isTerminal && (
        <div className={styles.terminalActions}>
          {progress.status === 'error' && selectedPackage && (
            <Button appearance='primary' onClick={() => void importPackage(selectedPackage)}>
              {strings.CatalogRetryText}
            </Button>
          )}
          <Button
            appearance={progress.status === 'error' ? 'secondary' : 'primary'}
            onClick={() => setState({ installProgress: undefined })}
          >
            {strings.CloseLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
