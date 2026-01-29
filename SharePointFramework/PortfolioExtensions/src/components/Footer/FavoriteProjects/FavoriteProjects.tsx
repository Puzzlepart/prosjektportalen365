import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  useId,
  Spinner
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'
import { useFavoriteProjects } from './useFavoriteProjects'

export const FavoriteProjects: FC = () => {
  const fluentProviderId = useId('fp-footer-favorite-projects')
  const { favoriteProjects, isLoading, error, fetchFavoriteProjects } = useFavoriteProjects()

  const handleMenuOpen = () => {
    // Always refetch favorite projects when menu is opened to ensure up-to-date list
    fetchFavoriteProjects()
  }

  const renderMenuItems = () => {
    if (isLoading) {
      return (
        <MenuItem disabled style={{ maxWidth: 'fit-content', minWidth: '100%' }}>
          <Spinner size="tiny" />
        </MenuItem>
      )
    }

    if (error) {
      return (
        <MenuItem disabled style={{ maxWidth: 'fit-content', minWidth: '100%' }}>
          {strings.FavoriteProjectsErrorMessage}
        </MenuItem>
      )
    }

    if (favoriteProjects.length === 0) {
      return (
        <MenuItem disabled style={{ maxWidth: 'fit-content', minWidth: '100%' }}>
          {strings.FavoriteProjectsEmptyMessage}
        </MenuItem>
      )
    }

    return favoriteProjects.map((project) => (
      <MenuItem
        style={{ maxWidth: 'fit-content', minWidth: '100%' }}
        key={project.url}
        onClick={() => window.open(project.url, '_blank')}
      >
        {project.title}
      </MenuItem>
    ))
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Menu onOpenChange={(_, data) => data.open && handleMenuOpen()}>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip
              relationship="description"
              withArrow
              content={strings.FavoriteProjectsDescription}
            >
              <MenuButton size="small" appearance="subtle" icon={getFluentIcon('Collections')}>
                {strings.FavoriteProjectsLabel}
              </MenuButton>
            </Tooltip>
          </MenuTrigger>
          <MenuPopover style={{ minWidth: 'fit-content' }}>
            <MenuList>{renderMenuItems()}</MenuList>
          </MenuPopover>
        </Menu>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
