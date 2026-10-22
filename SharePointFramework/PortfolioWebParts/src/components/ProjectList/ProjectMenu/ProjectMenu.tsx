import {
  Menu,
  MenuButton,
  MenuItemLink,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
  makeStyles
} from '@fluentui/react-components'
import { CalendarMonthFilled, CalendarMonthRegular, bundleIcon } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { FC } from 'react'
import { IProjectMenu } from './types'
const CalendarMonth = bundleIcon(CalendarMonthFilled, CalendarMonthRegular)

const useStyles = makeStyles({
  menuButton: {
    backgroundColor: 'var(--colorNeutralBackground3)',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground3Hover)'
    }
  }
})

export const ProjectMenu: FC<IProjectMenu> = (props) => {
  const styles = useStyles()

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tooltip content={strings.ProjectListQuickLaunch} relationship='label' withArrow>
          <MenuButton
            className={props.appearance === 'subtle' ? styles.menuButton : ''}
            appearance={props.appearance}
            icon={<CalendarMonth />}
            size={props.size}
            disabled={props.disabled}
          />
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {props.context.quickLaunchMenu
            ?.sort((a, b) => a.order - b.order)
            ?.map((quickLaunchItem, idx) => (
              // The menu item is the link: a link inside a menu item was out of the keyboard's
              // reach, as the item takes the focus and did nothing on Enter (WCAG 2.1.1).
              <MenuItemLink
                key={idx}
                href={(props.project?.url || '') + quickLaunchItem.relativeUrl}
              >
                {quickLaunchItem.text}
              </MenuItemLink>
            ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
