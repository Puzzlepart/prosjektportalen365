import { Button, ProgressBar, Spinner, Text } from '@fluentui/react-components'
import {
  CheckmarkCircle24Filled,
  Circle24Regular,
  ErrorCircle24Filled,
  SubtractCircle24Regular
} from '@fluentui/react-icons'
import { UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { InstallStepKey, InstallStepStatus } from '../../models'
import { useCatalogContext } from '../TemplatePackageCatalog/context'
import styles from './InstallProgress.module.scss'

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
    case InstallStepKey.UpdateMaloppsett:
      return strings.CatalogStepUpdateMaloppsett
    default:
      return key
  }
}

const StepIcon: FC<{ status: InstallStepStatus }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <Spinner size="tiny" />
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

export const InstallProgress: FC = () => {
  const { state, setState } = useCatalogContext()
  const progress = state.installProgress
  if (!progress) return null

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

  return (
    <div className={styles.root}>
      <ProgressBar value={completed / total} max={1} />
      <div className={styles.steps}>
        {progress.steps.map((step) => (
          <div key={step.key} className={styles.step}>
            <StepIcon status={step.status} />
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

      {progress.status === 'success' && (
        <UserMessage
          intent="success"
          title={strings.CatalogInstallSuccessTitle}
          text={strings.CatalogInstallSuccessText}
        />
      )}
      {progress.status === 'error' && (
        <UserMessage
          intent="error"
          title={strings.CatalogInstallErrorTitle}
          text={progress.error}
        />
      )}
      {isTerminal && (
        <Button appearance="primary" onClick={() => setState({ installProgress: undefined })}>
          {strings.CloseLabel}
        </Button>
      )}
    </div>
  )
}
