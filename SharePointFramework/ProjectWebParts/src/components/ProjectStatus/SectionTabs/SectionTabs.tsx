import React, { FC } from 'react'
import styles from '../ProjectStatus.module.scss'
import { TabList, Tab, SelectTabData } from '@fluentui/react-components'
import { useSections } from '../Sections/useSections'
import smoothscroll from 'smoothscroll-polyfill'
import { Sticky, StickyPositionType } from '@fluentui/react'

export const SectionTabs: FC = () => {
  smoothscroll.polyfill()
  const sections = useSections()

  const scrollIntoView = (sectionId) => {
    const scrollablePane = document.querySelector('.ms-ScrollablePane--contentContainer')
    const section = document.getElementById(`seksjon${sectionId}`)

    if (scrollablePane && section) {
      const relativeTop = section.offsetTop - scrollablePane.scrollTop

      if (relativeTop !== 0) {
        scrollablePane.scrollTo({
          top: scrollablePane.scrollTop + relativeTop - 80,
          behavior: 'smooth'
        })
      }
    }
  }

  return (
    <Sticky stickyClassName={styles.sticky} stickyPosition={StickyPositionType.Header}>
      <TabList
        className={styles.sectionTabs}
        defaultSelectedValue={1}
        onTabSelect={(_, data: SelectTabData) => scrollIntoView(data.value)}
      >
        {sections.map((section) => {
          return (
            <Tab key={section.id} value={section.id} title={section.name}>
              {section.name}
            </Tab>
          )
        })}
      </TabList>
    </Sticky>
  )
}
