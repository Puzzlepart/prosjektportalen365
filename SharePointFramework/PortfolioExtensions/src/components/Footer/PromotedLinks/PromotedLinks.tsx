import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import {
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip
} from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import resource from 'SharedResources'

export const PromotedLinks: FC = () => {
  const context = useContext(FooterContext)
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip
          relationship='description'
          withArrow
          content={
            <>
              {strings.LinksListDescription}
              <Link
                href={`${context.props.portalUrl}/${resource.Lists_Links_Url}/AllItems.aspx`}
                target='_blank'
                title={resource.Lists_Links_Title}
              >
                {resource.Lists_Links_Title}
              </Link>
            </>
          }
        >
          <MenuButton size='small' appearance='subtle' icon={getFluentIcon('Link')}>
            {strings.LinksListLabel}
          </MenuButton>
        </Tooltip>
      </MenuTrigger>
      <MenuPopover style={{ minWidth: 'fit-content' }}>
        <MenuList>
          {context.props.links
            .filter((link) => {
              if (context.props.pageContext.legacyPageContext.isSiteAdmin) return true
              else return link.Level !== strings.AdministratorLabel
            })
            .map((link, idx) => (
              <MenuItem
                style={{ maxWidth: 'fit-content', minWidth: '100%' }}
                key={idx}
                onClick={() => window.open(link.Url, '_blank')}
              >
                {link.Description}
              </MenuItem>
            ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
