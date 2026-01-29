import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
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
  useId
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'

export const FavoriteProjects: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-favorite-projects')

  if (!context.props.favoriteProjects || context.props.favoriteProjects.length === 0) {
    return null
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Tooltip
              relationship='description'
              withArrow
              content={strings.FavoriteProjectsDescription}
            >
              <MenuButton size='small' appearance='subtle' icon={getFluentIcon('FavoriteStar')}>
                {strings.FavoriteProjectsLabel}
              </MenuButton>
            </Tooltip>
          </MenuTrigger>
          <MenuPopover style={{ minWidth: 'fit-content' }}>
            <MenuList>
              {context.props.favoriteProjects.length === 0 ? (
                <MenuItem disabled style={{ maxWidth: 'fit-content', minWidth: '100%' }}>
                  {strings.FavoriteProjectsNoItemsMessage}
                </MenuItem>
              ) : (
                context.props.favoriteProjects.map((project, idx) => (
                  <MenuItem
                    style={{ maxWidth: 'fit-content', minWidth: '100%' }}
                    key={idx}
                    onClick={() => window.open(project.url, '_self')}
                  >
                    {project.name}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
