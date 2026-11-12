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
 * Links hub site administrators to site settings and site contents.
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
