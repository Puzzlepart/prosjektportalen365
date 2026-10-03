import React, { FC } from 'react'
import {
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  TabList,
  Tab,
  SelectTabData,
  useIsOverflowItemVisible,
  useOverflowMenu
} from '@fluentui/react-components'
import { MoreHorizontalRegular } from '@fluentui/react-icons'
import smoothscroll from 'smoothscroll-polyfill'
import styles from '../ProjectStatus.module.scss'
import { useSections } from '../Sections/useSections'
import { useScrollToSection } from './useScrollToSection'

const OverflowMenuItem: FC<{
  section: { id: number; name: string }
  onClick: (id: number) => void
}> = ({ section, onClick }) => {
  const isVisible = useIsOverflowItemVisible(String(section.id))
  if (isVisible) return null
  return (
    <MenuItem key={section.id} onClick={() => onClick(section.id)}>
      {section.name}
    </MenuItem>
  )
}

const OverflowMenu: FC<{
  sections: { id: number; name: string }[]
  onSelect: (id: number) => void
}> = ({ sections, onSelect }) => {
  const { ref, isOverflowing, overflowCount } = useOverflowMenu<HTMLButtonElement>()
  if (!isOverflowing) return null
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tab ref={ref} role='tab' value='overflow-menu' icon={<MoreHorizontalRegular />}>
          +{overflowCount}
        </Tab>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {sections.map((s) => (
            <OverflowMenuItem key={s.id} section={s} onClick={onSelect} />
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

export const SectionTabs: FC = () => {
  smoothscroll.polyfill()
  // While the report loads, the sections are placeholders without an id; they get no tab.
  const sections = useSections().filter(
    (section) => section.id !== undefined && section.id !== null
  )

  const scrollToSection = useScrollToSection()

  return (
    <div className={styles.stickyTabs}>
      <Overflow>
        <TabList
          className={styles.sectionTabs}
          defaultSelectedValue={1}
          onTabSelect={(_, data: SelectTabData) => {
            if (data.value === 'overflow-menu') return
            scrollToSection(data.value as number)
          }}
        >
          {sections.map((section) => {
            return (
              <OverflowItem key={section.id} id={String(section.id)}>
                <Tab key={section.id} value={section.id} title={section.name}>
                  {section.name}
                </Tab>
              </OverflowItem>
            )
          })}
          <OverflowMenu sections={sections} onSelect={scrollToSection} />
        </TabList>
      </Overflow>
    </div>
  )
}
