import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import {
  Menu,
  MenuItem,
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
              <Tooltip
                relationship='description'
                withArrow
                content={strings.SiteSettingsDescription}
              >
                <SplitButton
                  size='small'
                  appearance='subtle'
                  icon={getFluentIcon('Settings')}
                  primaryActionButton={{
                    onClick: () =>
                      window.open(
                        `${context.props.portalUrl}/_layouts/15/settings.aspx`,
                        '_blank'
                      )
                  }}
                >
                  {strings.SiteSettingsLabel}
                </SplitButton>
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={getFluentIcon('TextBulletList')}
                  onClick={() =>
                    window.open(
                      `${context.props.portalUrl}/_layouts/15/viewlsts.aspx`,
                      '_blank'
                    )
                  }
                >
                  {strings.SiteContentsLabel}
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </FluentProvider>
      </IdPrefixProvider>
    </div>
  )
}
