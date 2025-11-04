import {
  FluentProvider,
  IdPrefixProvider,
  Menu,
  MenuButtonProps,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Skeleton,
  SkeletonItem,
  SplitButton,
  Toaster,
  useRestoreFocusTarget,
  useToastController
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { IProjectProvisionProps } from './types'
import { customLightTheme, getFluentIcon, UserMessage } from 'pp365-shared-library'
import { ProvisionStatus } from './ProvisionStatus'
import { useProjectProvision } from './useProjectProvision'
import { ProjectProvisionContext } from './context'
import { ProvisionDrawer } from './ProvisionDrawer'
import strings from 'PortfolioWebPartsStrings'
import { ProvisionSettings } from './ProvisionSettings'
import { stringIsNullOrEmpty } from '@pnp/core'

export const ProjectProvision: FC<IProjectProvisionProps> = (props) => {
  const {
    state,
    setState,
    column,
    setColumn,
    reset,
    toasterId,
    fluentProviderId,
    hasProjectProvisionAccess
  } = useProjectProvision(props)
  const restoreFocusTargetAttribute = useRestoreFocusTarget()
  const { dispatchToast } = useToastController(toasterId)

  if (state.loading) {
    return (
      <Skeleton>
        <SkeletonItem style={{ width: '192px', height: '40px' }} />
      </Skeleton>
    )
  }

  if (state.error) {
    return <UserMessage title={strings.ErrorTitle} text={state.error.message} intent='error' />
  }

  if (state.accessDenied) {
    return (
      <UserMessage
        title={strings.AccessTitle}
        text={strings.Provision.NoProvisionAccessMessage}
        intent='warning'
      />
    )
  }

  if (!hasProjectProvisionAccess) {
    return null
  }

  if (stringIsNullOrEmpty(props.provisionUrl)) {
    return (
      <UserMessage
        title={strings.Provision.NotConfiguredTitle}
        text={strings.Provision.NotConfiguredText}
        intent='warning'
      />
    )
  }

  return (
    <ProjectProvisionContext.Provider value={{ props, state, setState, column, setColumn, reset }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <ProvisionDrawer toast={dispatchToast} />
          <Menu positioning='below-end'>
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton
                  menuButton={triggerProps}
                  primaryActionButton={{
                    onClick: () => setState({ showProvisionDrawer: true })
                  }}
                  icon={props.icon}
                  appearance={props.appearance}
                  size={props.size}
                  disabled={props.disabled}
                >
                  {props.buttonLabel}
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {!props.hideStatusMenu && (
                  <MenuItem
                    {...restoreFocusTargetAttribute}
                    onClick={() => {
                      setState({ showProvisionStatus: true })
                    }}
                  >
                    {strings.Provision.StatusMenuLabel}
                  </MenuItem>
                )}
                {props.pageContext.legacyPageContext.isSiteAdmin ||
                  (!props.hideSettingsMenu && (
                    <MenuItem
                      {...restoreFocusTargetAttribute}
                      onClick={() => {
                        setState({ showProvisionSettings: true })
                      }}
                    >
                      {strings.Provision.SettingsMenuLabel}
                    </MenuItem>
                  ))}
              </MenuList>
            </MenuPopover>
          </Menu>
          <ProvisionStatus toast={dispatchToast} />
          <ProvisionSettings />
          <Toaster toasterId={toasterId} />
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectProvisionContext.Provider>
  )
}

ProjectProvision.defaultProps = {
  buttonLabel: strings.Provision.ProvisionButtonLabel,
  autoOwner: true,
  expirationDateMode: 'date',
  defaultExpirationDate: '0',
  level0Header: strings.Provision.DrawerLevel0HeaderText,
  level0Description: strings.Provision.DrawerLevel0DescriptionText,
  level1Header: strings.Provision.DrawerLevel1HeaderText,
  level1Description: strings.Provision.DrawerLevel1DescriptionText,
  level2Header: strings.Provision.DrawerLevel2HeaderText,
  level2Description: strings.Provision.DrawerLevel2DescriptionText,
  footerDescription: strings.Provision.DrawerFooterDescriptionText,
  readOnlyGroupLogic: false,
  icon: getFluentIcon('Add'),
  appearance: 'primary',
  size: 'large'
}
