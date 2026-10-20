import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import {
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemLink,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  Spinner
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'
import resource from 'SharedResources'
import { usePromotedLinks } from './usePromotedLinks'

export const PromotedLinks: FC = () => {
  const { context, fluentProviderId, popoverId, open, onOpenChange, isLoaded } = usePromotedLinks()
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Menu open={open} onOpenChange={onOpenChange}>
          <MenuTrigger disableButtonEnhancement>
            {/* Text only: a link in a tooltip is out of the keyboard's reach (WCAG 2.1.1). */}
            <Tooltip relationship='description' withArrow content={strings.LinksListDescription}>
              <MenuButton size='small' appearance='subtle' icon={getFluentIcon('Link')}>
                {strings.LinksListLabel}
              </MenuButton>
            </Tooltip>
          </MenuTrigger>
          <MenuPopover id={popoverId} style={{ minWidth: 'fit-content' }}>
            {!isLoaded ? (
              <Spinner size='tiny' label={strings.LinksListLabel} style={{ padding: '8px' }} />
            ) : (
              <MenuList>
                {context.links
                  .filter((link) => {
                    if (context.props.pageContext.legacyPageContext.isSiteAdmin) return true
                    else return link.Level !== strings.AdministratorLabel
                  })
                  .map((link, idx) => (
                    // A page elsewhere, so a link (WCAG 4.1.2).
                    <MenuItemLink
                      style={{ maxWidth: 'fit-content', minWidth: '100%' }}
                      key={idx}
                      href={link.Url}
                      target='_blank'
                    >
                      {link.Description}
                    </MenuItemLink>
                  ))}
                <MenuDivider />
                {/* The list the links come from, where the tooltip had it. */}
                <MenuItemLink
                  icon={getFluentIcon('Edit')}
                  href={`${context.props.portalUrl}/${resource.Lists_Links_Url}/AllItems.aspx`}
                  target='_blank'
                >
                  {strings.LinksListOpenLabel}
                </MenuItemLink>
              </MenuList>
            )}
          </MenuPopover>
        </Menu>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
