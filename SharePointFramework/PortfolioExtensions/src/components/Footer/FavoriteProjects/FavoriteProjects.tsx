import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  useId,
  Link,
  Divider
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme, WebPartTitle } from 'pp365-shared-library'

export const FavoriteProjects: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-favorite-projects')

  // Don't render if favoriteProjects is not defined
  if (!context.props.favoriteProjects) {
    return null
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Popover withArrow positioning='above-start'>
          <PopoverTrigger disableButtonEnhancement>
            <Tooltip
              relationship='description'
              withArrow
              content={strings.FavoriteProjectsDescription}
            >
              <Button size='small' appearance='subtle' icon={getFluentIcon('FavoriteStar')}>
                {strings.FavoriteProjectsLabel}
              </Button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverSurface style={{ maxHeight: '420px', overflow: 'auto' }}>
            <WebPartTitle
              title={strings.FavoriteProjectsLabel}
              description={strings.FavoriteProjectsDescription}
            />
            <Divider style={{ padding: '12px' }}/>
            {context.props.favoriteProjects.length === 0 ? (
              <div style={{ padding: '4px 8px' }}>
                {strings.FavoriteProjectsNoItemsMessage}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {context.props.favoriteProjects.map((project) => (
                  <Link
                    key={project.url}
                    href={project.url}
                    style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}
                  >
                    {project.name}
                  </Link>
                ))}
              </div>
            )}
          </PopoverSurface>
        </Popover>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
