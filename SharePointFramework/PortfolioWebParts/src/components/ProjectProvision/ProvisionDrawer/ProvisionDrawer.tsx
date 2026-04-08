import React, { FC } from 'react'
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderNavigation,
  ToolbarGroup,
  ToolbarButton,
  mergeClasses,
  DrawerBody,
  DrawerHeaderTitle,
  DrawerFooter,
  Toolbar,
  Button,
  Toast,
  ToastBody,
  ToastTitle,
  IdPrefixProvider,
  FluentProvider
} from '@fluentui/react-components'
import strings from 'PortfolioWebPartsStrings'
import { customLightTheme, getFluentIcon, UserMessage } from 'pp365-shared-library'
import { useProvisionDrawer } from './useProvisionDrawer'
import styles from './ProvisionDrawer.module.scss'
import { DebugModel } from './DebugModel'
import { IProvisionDrawerProps } from './types'
import { stringIsNullOrEmpty } from '@pnp/core'
import { FieldRendererList, useFieldConfigs } from './FieldRenderer'
import { useLocalInput } from './useLocalInput'
import { ProvisionConfirmation } from '../ProvisionConfirmation'

declare const DEBUG: boolean

export const ProvisionDrawer: FC<IProvisionDrawerProps> = (props) => {
  const {
    levels,
    currentLevel,
    setCurrentLevel,
    toolbarBackIconMotion,
    levelMotions,
    motionStyles,
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

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <OverlayDrawer
          role='panel'
          position='end'
          open={context.state.showProvisionDrawer}
          size='medium'
          onOpenChange={(_, { open }) => context.setState({ showProvisionDrawer: open })}
        >
          <DrawerHeader>
            <DrawerHeaderNavigation>
              <Toolbar className={styles.toolbar}>
                <ToolbarGroup>
                  {toolbarBackIconMotion.canRender && (
                    <ToolbarButton
                      ref={toolbarBackIconMotion.ref}
                      className={mergeClasses(
                        motionStyles.toolbarButton,
                        toolbarBackIconMotion.active && motionStyles.toolbarButtonVisible
                      )}
                      title={strings.Aria.Back}
                      appearance='subtle'
                      icon={getFluentIcon('ArrowLeft')}
                      onClick={() => setCurrentLevel(currentLevel - 1)}
                    />
                  )}
                </ToolbarGroup>
                <ToolbarGroup>
                  <ToolbarButton
                    appearance='subtle'
                    icon={getFluentIcon('ClipboardTask')}
                    onClick={() => context.setState({ showProvisionStatus: true })}
                  >
                    {strings.Provision.ViewRequestsButton}
                  </ToolbarButton>
                  {context.state.isProvisionSiteAdmin && (
                    <ToolbarButton
                      appearance='subtle'
                      icon={getFluentIcon('Settings')}
                      onClick={() => context.setState({ showProvisionSettings: true })}
                    />
                  )}
                  <ToolbarButton
                    title={strings.Aria.Close}
                    appearance='subtle'
                    icon={getFluentIcon('Dismiss')}
                    onClick={() => context.setState({ showProvisionDrawer: false })}
                  />
                </ToolbarGroup>
              </Toolbar>
            </DrawerHeaderNavigation>
          </DrawerHeader>
          <div className={styles.body}>
            {context.state.showProvisionConfirmation ? (
              <DrawerBody>
                <ProvisionConfirmation
                  onNewRequest={() => {
                    context.setState({ showProvisionConfirmation: false })
                    setCurrentLevel(0)
                  }}
                />
              </DrawerBody>
            ) : null}
            {!context.state.showProvisionConfirmation && levelMotions[0].canRender && (
              <DrawerBody
                ref={levelMotions[0].ref}
                className={mergeClasses(
                  styles.level,
                  motionStyles.level,
                  motionStyles.level0,
                  levelMotions[0].active && motionStyles.levelVisible
                )}
              >
                {!stringIsNullOrEmpty(context.props.level0Header) && (
                  <DrawerHeaderTitle>{levels[0].title}</DrawerHeaderTitle>
                )}
                {!stringIsNullOrEmpty(context.props.level0Description) && (
                  <p>{levels[0].description}</p>
                )}
                <div className={styles.content}>
                  <FieldRendererList fields={fieldsToUse} level={0} configs={fieldConfigs} />
                </div>
              </DrawerBody>
            )}
            {!context.state.showProvisionConfirmation && <DrawerBody
              ref={levelMotions[1].ref}
              className={mergeClasses(
                styles.level,
                motionStyles.level,
                currentLevel === 2 ? motionStyles.level1a : motionStyles.level1,
                levelMotions[1].active && motionStyles.levelVisible
              )}
            >
              {!stringIsNullOrEmpty(context.props.level1Header) && (
                <DrawerHeaderTitle>{levels[1].title}</DrawerHeaderTitle>
              )}
              {!stringIsNullOrEmpty(context.props.level1Description) && (
                <p>{levels[1].description}</p>
              )}
              <div className={styles.content}>
                <FieldRendererList fields={fieldsToUse} level={1} configs={fieldConfigs} />
              </div>
            </DrawerBody>}
            {!context.state.showProvisionConfirmation && levelMotions[2].canRender && (
              <DrawerBody
                ref={levelMotions[2].ref}
                className={mergeClasses(
                  styles.level,
                  motionStyles.level,
                  motionStyles.level2,
                  levelMotions[2].active && motionStyles.levelVisible
                )}
              >
                {!stringIsNullOrEmpty(context.props.level2Header) && (
                  <DrawerHeaderTitle>{levels[2].title}</DrawerHeaderTitle>
                )}
                {!stringIsNullOrEmpty(context.props.level2Description) && (
                  <p>{levels[2].description}</p>
                )}
                <div className={styles.content}>
                  {(context.props.debugMode ||
                    (typeof sessionStorage !== 'undefined' && sessionStorage.DEBUG) ||
                    (typeof DEBUG !== 'undefined' && DEBUG)) && <DebugModel />}
                  <FieldRendererList fields={fieldsToUse} level={2} configs={fieldConfigs} />
                  {!stringIsNullOrEmpty(context.props.footerDescription) && (
                    <p className={styles.ignoreGap}>{context.props.footerDescription}</p>
                  )}
                  {isSaveDisabled && missingFieldsInfo.missingFields.length > 0 && (
                    <UserMessage
                      intent='error'
                      title={strings.Provision.MissingFieldsTitle}
                      text={`<ul>
                          ${missingFieldsInfo.missingFields
                            .map((field) => `<li>${field.displayName}</li>`)
                            .join('')}
                        </ul>`}
                      containerStyle={{ marginTop: '16px' }}
                    />
                  )}
                </div>
              </DrawerBody>
            )}
          </div>
          {!context.state.showProvisionConfirmation && <DrawerFooter className={styles.footer}>
            <Button
              appearance='subtle'
              disabled={currentLevel === 0}
              onClick={() => setCurrentLevel(currentLevel - 1)}
            >
              {strings.Provision.PreviousButtonLabel}
            </Button>
            <Button
              appearance='primary'
              disabled={currentLevel === levels.length - 1 && isSaveDisabled}
              onClick={() => {
                currentLevel === levels.length - 1
                  ? onSave().then((response) => {
                      if (response) {
                        props.toast(
                          <Toast appearance='inverted'>
                            <ToastTitle>{strings.Provision.ToastCreatedTitle}</ToastTitle>
                            <ToastBody>{strings.Provision.ToastCreatedBody}</ToastBody>
                          </Toast>,
                          { intent: 'success' }
                        )
                        context.setState({ showProvisionConfirmation: true, properties: {} })
                        setCurrentLevel(0)
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
                  : setCurrentLevel(currentLevel + 1)
              }}
            >
              {currentLevel === levels.length - 1
                ? strings.Provision.ProvisionButtonLabel
                : strings.Provision.NextButtonLabel}
            </Button>
          </DrawerFooter>}
        </OverlayDrawer>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
