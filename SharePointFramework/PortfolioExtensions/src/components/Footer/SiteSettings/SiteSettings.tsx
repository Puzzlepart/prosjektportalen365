import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import {
  Menu,
  MenuButtonProps,
  MenuItemLink,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'

/**
 * The hub's site settings for site admins: a link to the settings, and a menu with a link to the
 * site contents. The settings and the site contents are pages, so links that can be opened where
 * the user wants them, and the menu button is named for itself: without a name of its own, Fluent
 * names it by the settings link (WCAG 4.1.2, 2.4.4).
 */
export const SiteSettings: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-site-settings')
  const isHidden = context.props.portalUrl !== context.props.pageContext.web.absoluteUrl
  if (!context.props.pageContext.legacyPageContext.isSiteAdmin) return null
  return (
    <div style={{ display: isHidden ? 'none' : 'inline-block' }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <Menu positioning='above'>
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton
                  size='small'
                  appearance='subtle'
                  icon={getFluentIcon('Settings')}
                  menuButton={{ ...triggerProps, 'aria-label': strings.SiteSettingsMoreLabel }}
                  primaryActionButton={{
                    as: 'a',
                    href: `${context.props.portalUrl}/_layouts/15/settings.aspx`,
                    target: '_blank',
                    // The description goes on the link, the control, not on the split button's frame.
                    children: (Component, props) => (
                      <Tooltip
                        relationship='description'
                        withArrow
                        content={strings.SiteSettingsDescription}
                      >
                        <Component {...props} />
                      </Tooltip>
                    )
                  }}
                >
                  {strings.SiteSettingsLabel}
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItemLink
                  icon={getFluentIcon('TextBulletList')}
                  href={`${context.props.portalUrl}/_layouts/15/viewlsts.aspx`}
                  target='_blank'
                >
                  {strings.SiteContentsLabel}
                </MenuItemLink>
              </MenuList>
            </MenuPopover>
          </Menu>
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}
