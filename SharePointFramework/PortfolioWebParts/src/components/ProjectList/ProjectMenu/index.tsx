import * as React from 'react'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
  Link,
  makeStyles
} from '@fluentui/react-components'
import { FC } from 'react'
import { CalendarMonthFilled, CalendarMonthRegular, bundleIcon } from '@fluentui/react-icons'
import strings from 'PortfolioWebPartsStrings'
import { IProjectMenu } from './types'

const useStyles = makeStyles({
  menuButton: {
    backgroundColor: 'var(--colorNeutralBackground3)',
    '&:hover': {
      backgroundColor: 'var(--colorNeutralBackground3Hover)'
    }
  }
})

export const ProjectMenu: FC<IProjectMenu> = (props) => {
  const CalendarMonth = bundleIcon(CalendarMonthFilled, CalendarMonthRegular)
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
          />
        </Tooltip>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {props.context.quickLaunchMenu
            .sort((a, b) => a.order - b.order)
            .map((quickLaunchItem, idx) => (
              <MenuItem key={idx}>
                <Link
                  href={props.project.url + quickLaunchItem.relativeUrl}
                  title={quickLaunchItem.text}
                >
                  {quickLaunchItem.text}
                </Link>
              </MenuItem>
            ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
