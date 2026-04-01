import React, { FC, useState } from 'react'
import {
  OverlayDrawer,
  Toast,
  ToastBody,
  ToastTitle,
  IdPrefixProvider,
  FluentProvider,
  mergeClasses
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { customLightTheme } from 'pp365-shared-library'
import { useProvisionDrawer } from '../useProvisionDrawer'
import { useFieldConfigs } from '../FieldRenderer'
import { FullscreenHeader } from './FullscreenHeader'
import { FullscreenSiteType } from './FullscreenSiteType'
import { FullscreenFields } from './FullscreenFields'
import { ProvisionConfirmation } from '../../ProvisionConfirmation'
import { ProvisionStatus } from '../../ProvisionStatus'
import { ProvisionSettings } from '../../ProvisionSettings'
import { IProvisionDrawerProps } from '../types'
import styles from './FullscreenDrawer.module.scss'

/**
 * Fullscreen drawer experience for ProjectProvision.
 * Used in fullscreen drawer mode and inline/Teams mode.
 *
 * Two-level navigation:
 * - Level 1: SiteType selection (centered, large cards)
 * - Level 2: All fields in multi-column layout
 */
export const FullscreenDrawer: FC<IProvisionDrawerProps> = (props) => {
  const {
    context,
    onSave,
    isSaveDisabled,
    missingFieldsInfo,
    siteExists,
    setSiteExists,
    duplicateOwnerMembers,
    namingConvention,
    enableSensitivityLabels,
    enableSensitivityLabelsLibrary,
    enableRetentionLabels,
    enableExpirationDate,
    enableReadOnlyGroup,
    enableInternalChannel,
    enableExternalSharing,
    urlPrefix,
    aliasSuffix,
    isTeam,
    joinHub,
    usesDifferentHub,
    getField,
    fieldsToUse,
    fluentProviderId
  } = useProvisionDrawer()

  const fieldConfigs = useFieldConfigs({
    siteExists,
    setSiteExists,
    duplicateOwnerMembers,
    namingConvention,
    urlPrefix,
    aliasSuffix,
    isTeam,
    joinHub,
    usesDifferentHub,
    enableSensitivityLabels,
    enableSensitivityLabelsLibrary,
    enableRetentionLabels,
    enableExpirationDate,
    enableReadOnlyGroup,
    enableInternalChannel,
    enableExternalSharing,
    getField
  })

  const [currentStep, setCurrentStep] = useState<'siteType' | 'fields'>(
    context.column.get('type') ? 'fields' : 'siteType'
  )
  const [showStatusInDrawer, setShowStatusInDrawer] = useState(false)
  const [showSettingsInDrawer, setShowSettingsInDrawer] = useState(false)

  const isInlineMode = props.renderMode === 'inline'
  const isTeamsMode = context.props.isTeamsContext

  const handleSave = () => {
    onSave().then((response) => {
      if (response) {
        if (isInlineMode) {
          context.setState({ showProvisionConfirmation: true, properties: {} })
        } else {
          props.toast(
            <Toast appearance='inverted'>
              <ToastTitle>{strings.Provision.ToastCreatedTitle}</ToastTitle>
              <ToastBody>{strings.Provision.ToastCreatedBody}</ToastBody>
            </Toast>,
            { intent: 'success' }
          )
          context.setState({ showProvisionDrawer: false, properties: {} })
        }
        setCurrentStep('siteType')
        context.reset()
      } else {
        props.toast(
          <Toast appearance='inverted'>
            <ToastTitle>{strings.Provision.ToastCreatedErrorTitle}</ToastTitle>
            <ToastBody>{strings.Provision.ToastCreatedErrorBody}</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
      }
    })
  }

  const renderContent = () => {
    if (context.state.showProvisionConfirmation) {
      return (
        <ProvisionConfirmation
          onNewRequest={() => {
            context.setState({ showProvisionConfirmation: false, showProvisionDrawer: true })
            setCurrentStep('siteType')
          }}
          onViewRequests={() => {
            context.setState({
              showProvisionConfirmation: false,
              showProvisionStatus: true,
              showProvisionDrawer: false
            })
          }}
        />
      )
    }

    if (showStatusInDrawer) {
      return (
        <div className={styles.statusContainer}>
          <ProvisionStatus
            toast={props.toast}
            renderMode='inline'
            onBack={() => setShowStatusInDrawer(false)}
          />
        </div>
      )
    }

    if (showSettingsInDrawer) {
      return (
        <div className={styles.statusContainer}>
          <ProvisionSettings
            renderMode='inline'
            onBack={() => setShowSettingsInDrawer(false)}
          />
        </div>
      )
    }

    return (
      <div className={styles.fullscreenContent}>
        <FullscreenHeader
          showBack={currentStep === 'fields'}
          onBack={() => setCurrentStep('siteType')}
          onClose={!isInlineMode ? () => context.setState({ showProvisionDrawer: false }) : undefined}
          onViewSettings={() => setShowSettingsInDrawer(true)}
          onViewRequests={() => setShowStatusInDrawer(true)}
        />
        <div className={styles.fullscreenBody}>
          {currentStep === 'siteType' ? (
            <FullscreenSiteType
              onTypeSelected={() => setCurrentStep('fields')}
            />
          ) : (
            <FullscreenFields
              fields={fieldsToUse}
              fieldConfigs={fieldConfigs}
              isSaveDisabled={isSaveDisabled}
              missingFieldsInfo={missingFieldsInfo}
              onSave={handleSave}
              onBack={() => setCurrentStep('siteType')}
            />
          )}
        </div>
      </div>
    )
  }

  const content = renderContent()

  if (isInlineMode) {
    return (
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider
          theme={customLightTheme}
          className={mergeClasses(
            styles.fullscreenProvider,
            isTeamsMode ? 'teams-mode' : 'sp-mode'
          )}
        >
          {content}
        </FluentProvider>
      </IdPrefixProvider>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          role='panel'
          position='end'
          open={context.state.showProvisionDrawer}
          size='full'
          onOpenChange={(_, { open }) => context.setState({ showProvisionDrawer: open })}
        >
          {content}
        </OverlayDrawer>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
