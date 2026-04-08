import React, { FC, useState } from 'react'
import {
  OverlayDrawer,
  Button,
  Tooltip,
  Toast,
  ToastBody,
  ToastTitle,
  IdPrefixProvider,
  FluentProvider,
  mergeClasses
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { customLightTheme } from 'pp365-shared-library'
import { useMotion } from '@fluentui/react-motion-preview'
import { useProvisionDrawer } from '../useProvisionDrawer'
import { useFullscreenMotionStyles } from './fullscreenMotionStyles'
import { useFieldConfigs } from '../FieldRenderer'
import { useLocalInput } from '../useLocalInput'
import { FullscreenHeader } from './FullscreenHeader'
import { FullscreenSiteType } from './FullscreenSiteType'
import { FullscreenFields } from './FullscreenFields'
import { ProvisionConfirmation } from '../../ProvisionConfirmation'
import { ProvisionStatus } from '../../ProvisionStatus'
import { ProvisionSettings } from '../../ProvisionSettings'
import { TeamsConfigEditor } from '../../TeamsConfigEditor'
export interface IFullscreenDrawerProps {
  toast?: any
  renderMode?: 'button' | 'inline'
}
import styles from './FullscreenDrawer.module.scss'

/**
 * Fullscreen drawer experience for ProjectProvision.
 * Used in fullscreen drawer mode and inline/Teams mode.
 *
 * Two-level navigation:
 * - Level 1: SiteType selection (centered, large cards)
 * - Level 2: All fields in multi-column layout
 */
export const FullscreenDrawer: FC<IFullscreenDrawerProps> = (props) => {
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

  const nameInput = useLocalInput('name')
  const descriptionInput = useLocalInput('description')
  const justificationInput = useLocalInput('justification')
  const additionalInfoInput = useLocalInput('additionalInfo')

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
    getField,
    localInputs: {
      name: nameInput,
      description: descriptionInput,
      justification: justificationInput,
      additionalInfo: additionalInfoInput
    }
  })

  const [currentStep, setCurrentStep] = useState<'siteType' | 'fields'>(
    context.column.get('type') ? 'fields' : 'siteType'
  )
  const [showStatusInDrawer, setShowStatusInDrawer] = useState(false)
  const [showSettingsInDrawer, setShowSettingsInDrawer] = useState(false)
  const [showConfigEditorInDrawer, setShowConfigEditorInDrawer] = useState(false)

  const motionStyles = useFullscreenMotionStyles()
  const siteTypeMotion = useMotion<HTMLDivElement>(currentStep === 'siteType')
  const fieldsMotion = useMotion<HTMLDivElement>(currentStep === 'fields')

  const isInlineMode = props.renderMode === 'inline'

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
        <div className={styles.fullscreenContent}>
          <FullscreenHeader
            titleOverride={strings.Provision.StatusMenuLabel}
            iconOverride='ClipboardTask'
            onBack={() => setShowStatusInDrawer(false)}
            onClose={
              !isInlineMode ? () => context.setState({ showProvisionDrawer: false }) : undefined
            }
          />
          <div className={styles.statusContainer}>
            <ProvisionStatus toast={props.toast} renderMode='inline' />
          </div>
        </div>
      )
    }

    if (showSettingsInDrawer) {
      return (
        <div className={styles.fullscreenContent}>
          <FullscreenHeader
            titleOverride={strings.Provision.SettingsMenuLabel}
            iconOverride='Settings'
            onBack={() => setShowSettingsInDrawer(false)}
            onClose={
              !isInlineMode ? () => context.setState({ showProvisionDrawer: false }) : undefined
            }
          />
          <div className={styles.statusContainer}>
            <ProvisionSettings renderMode='inline' />
          </div>
        </div>
      )
    }

    if (showConfigEditorInDrawer) {
      return (
        <div className={styles.fullscreenContent}>
          <FullscreenHeader
            titleOverride={strings.Provision.ConfigEditorTitle}
            iconOverride='ContentSettings'
            onBack={() => setShowConfigEditorInDrawer(false)}
            onClose={
              !isInlineMode ? () => context.setState({ showProvisionDrawer: false }) : undefined
            }
          />
          <div className={styles.statusContainer}>
            <TeamsConfigEditor
              onBack={() => setShowConfigEditorInDrawer(false)}
              isAdmin={context.state.isProvisionSiteAdmin}
            />
          </div>
        </div>
      )
    }

    return (
      <div className={styles.fullscreenContent}>
        <FullscreenHeader
          onClose={
            !isInlineMode ? () => context.setState({ showProvisionDrawer: false }) : undefined
          }
          onViewSettings={() => setShowSettingsInDrawer(true)}
          onViewRequests={() => setShowStatusInDrawer(true)}
          onViewConfigEditor={() => setShowConfigEditorInDrawer(true)}
        />
        <div className={styles.fullscreenBody}>
          <div
            ref={siteTypeMotion.canRender ? siteTypeMotion.ref : undefined}
            className={mergeClasses(
              styles.motionLevel,
              motionStyles.level,
              motionStyles.siteTypeLevel,
              currentStep === 'siteType' && motionStyles.levelVisible
            )}
            style={currentStep !== 'siteType' ? { pointerEvents: 'none' } : undefined}
          >
            <FullscreenSiteType onTypeSelected={() => setCurrentStep('fields')} />
          </div>
          <div
            ref={fieldsMotion.canRender ? fieldsMotion.ref : undefined}
            className={mergeClasses(
              styles.motionLevel,
              motionStyles.level,
              motionStyles.fieldsLevel,
              currentStep === 'fields' && motionStyles.levelVisible
            )}
            style={currentStep !== 'fields' ? { pointerEvents: 'none' } : undefined}
          >
            <FullscreenFields
              fields={fieldsToUse}
              fieldConfigs={fieldConfigs}
              onBack={() => setCurrentStep('siteType')}
            />
          </div>
        </div>
        {currentStep === 'fields' && (
          <div className={styles.fieldsFooter}>
            <Button appearance='subtle' onClick={() => setCurrentStep('siteType')}>
              {strings.Provision.PreviousButtonLabel}
            </Button>
            {missingFieldsInfo.missingFields.length > 0 ? (
              <Tooltip
                withArrow
                relationship='description'
                content={
                  <div>
                    <strong>{strings.Provision.MissingFieldsTitle}</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                      {missingFieldsInfo.missingFields.map((f) => (
                        <li key={f.fieldName}>{f.displayName}</li>
                      ))}
                    </ul>
                  </div>
                }
              >
                <Button
                  appearance='primary'
                  size='large'
                  disabled={isSaveDisabled}
                  onClick={handleSave}
                >
                  {strings.Provision.ProvisionButtonLabel}
                </Button>
              </Tooltip>
            ) : (
              <Button
                appearance='primary'
                size='large'
                disabled={isSaveDisabled}
                onClick={handleSave}
              >
                {strings.Provision.ProvisionButtonLabel}
              </Button>
            )}
          </div>
        )}
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
            context.props.isTeamsContext ? 'teams-mode' : 'sp-mode'
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
