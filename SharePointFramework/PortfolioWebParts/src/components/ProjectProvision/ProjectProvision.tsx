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
  const { state, setState, column, setColumn, reset, toasterId, fluentProviderId } =
    useProjectProvision(props)
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
    return (
      <UserMessage title={strings.ErrorTitle} text={state.error.message} intent='error' />
    )
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
        <FluentProvider theme={customLightTheme}>
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
                  {strings.Provision.ProvisionButtonLabel}
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  {...restoreFocusTargetAttribute}
                  onClick={() => {
                    setState({ showProvisionStatus: true })
                  }}
                >
                  {strings.Provision.StatusMenuLabel}
                </MenuItem>
                <MenuItem
                  {...restoreFocusTargetAttribute}
                  onClick={() => {
                    setState({ showProvisionSettings: true })
                  }}
                >
                  {strings.Provision.SettingsMenuLabel}
                </MenuItem>
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
  disabled: false,
  icon: getFluentIcon('Add'),
  appearance: 'primary',
  size: 'large'
}
