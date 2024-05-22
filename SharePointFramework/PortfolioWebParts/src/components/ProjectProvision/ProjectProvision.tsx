import {
  Menu,
  MenuButtonProps,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
  useRestoreFocusTarget
} from '@fluentui/react-components'
import React, { FC } from 'react'
import { IProjectProvisionProps } from './types'
import { getFluentIcon } from 'pp365-shared-library'
import { ProvisionStatus } from './ProvisionStatus'
import { useProjectProvision } from './useProjectProvision'
import { ProjectProvisionContext } from './context'
import { ProvisionDrawer } from './ProvisionDrawer'
import strings from 'PortfolioWebPartsStrings'

export const ProjectProvision: FC<IProjectProvisionProps> = (props) => {
  const { state, setState } = useProjectProvision(props)
  const restoreFocusTargetAttribute = useRestoreFocusTarget()

  return (
    <ProjectProvisionContext.Provider value={{ props, state, setState }}>
      <ProvisionDrawer />
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
              {strings.ProvisionButtonLabel}
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
              {strings.ProvisionStatusMenuLabel}
            </MenuItem>
            <MenuItem>{strings.RegisterIdeaMenuLabel}</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <ProvisionStatus />
    </ProjectProvisionContext.Provider>
  )
}
