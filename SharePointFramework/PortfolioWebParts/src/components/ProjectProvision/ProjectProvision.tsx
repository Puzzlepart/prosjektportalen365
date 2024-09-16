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
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import { ProvisionStatus } from './ProvisionStatus'
import { useProjectProvision } from './useProjectProvision'
import { ProjectProvisionContext } from './context'
import { ProvisionDrawer } from './ProvisionDrawer'
import strings from 'PortfolioWebPartsStrings'
import { ProvisionSettings } from './ProvisionSettings'

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
                  icon={getFluentIcon('Add')}
                  appearance='primary'
                  size='large'
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
          <ProvisionSettings toast={dispatchToast} />
          <Toaster toasterId={toasterId} />
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectProvisionContext.Provider>
  )
}
