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
                href={`${context.props.portalUrl}/Lists/Lenker/AllItems.aspx`}
                target='_blank'
                title={strings.LinksListName}
              >
                {strings.LinksListName}
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
          {context.props.links.map((link, idx) => (
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
