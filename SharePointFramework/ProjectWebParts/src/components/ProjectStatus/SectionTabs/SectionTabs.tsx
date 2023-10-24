import React, { FC } from 'react'
import styles from '../ProjectStatus.module.scss'
import { TabList, Tab, SelectTabData } from '@fluentui/react-components'
import { Sticky, StickyPositionType } from '@fluentui/react'
import { useSections } from '../Sections/useSections'

export const SectionTabs: FC = () => {
  const sections = useSections()
  return (
    <Sticky stickyClassName={styles.sticky} stickyPosition={StickyPositionType.Header}>
      {/* TODO: Make this actually sticky when scrolling... */}
      <TabList
        className={styles.sectionTabs}
        defaultSelectedValue={1}
        onTabSelect={(_, data: SelectTabData) => {
          const element = document.getElementById(`seksjon${data.value}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }}
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
