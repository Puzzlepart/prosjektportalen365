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
  Circle24Regular,
  ErrorCircle16Filled,
  ErrorCircle24Filled,
  Info16Regular,
  SubtractCircle24Regular,
  Warning16Filled
} from '@fluentui/react-icons'
import { UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useEffect, useRef } from 'react'
import { IInstallLogEntry, InstallStepKey, InstallStepStatus } from 'models'
import { useCatalogContext } from '../context'
import styles from './InstallProgress.module.scss'

const useLogStyles = makeStyles({
  log: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    maxHeight: '260px',
    overflowY: 'auto'
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS
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
    paddingLeft: tokens.spacingHorizontalXL,
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
  const progress = state.installProgress
  // Keep the advanced log scrolled to the latest line as entries stream in.
  const logRef = useRef<HTMLDivElement>(null)
  const totalLogEntries = (progress?.steps ?? []).reduce(
    (count, step) => count + (step.entries?.length ?? 0),
    0
  )
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
  // Steps that produced advanced-log entries (what was applied / skipped / failed).
  const stepsWithLog = progress.steps.filter((s) => (s.entries?.length ?? 0) > 0)

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

      {stepsWithLog.length > 0 && (
        <Accordion collapsible defaultOpenItems={['log']}>
          <AccordionItem value='log'>
            <AccordionHeader>{strings.CatalogAdvancedLogLabel}</AccordionHeader>
            <AccordionPanel>
              <div ref={logRef} className={cls.log}>
                {stepsWithLog.map((step) => (
                  <div key={step.key} className={cls.group}>
                    <div className={cls.groupHeader}>
                      <span className={styles.stepIcon}>
                        <StepIcon status={step.status} />
                      </span>
                      <Text size={200} weight='semibold'>
                        {stepLabel(step.key)}
                      </Text>
                      <Badge
                        appearance='tint'
                        color={step.status === 'error' ? 'danger' : 'informative'}
                        size='small'
                      >
                        {step.entries.length}
                      </Badge>
                    </div>
                    {step.entries.map((entry, index) => (
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
                  </div>
                ))}
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
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
