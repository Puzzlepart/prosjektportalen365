import {
  Menu,
  MenuButtonProps,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Skeleton,
  SkeletonItem,
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
  const { state, setState, column, setColumn } = useProjectProvision(props)
  const restoreFocusTargetAttribute = useRestoreFocusTarget()

  if (state.loading) {
    return (
      <Skeleton>
        <SkeletonItem style={{ width: '192px', height: '40px' }} />
      </Skeleton>
    )
  }

  return (
    <ProjectProvisionContext.Provider value={{ props, state, setState, column, setColumn }}>
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
