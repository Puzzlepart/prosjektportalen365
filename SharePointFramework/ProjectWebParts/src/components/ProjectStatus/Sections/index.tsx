import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { SectionType } from 'pp365-shared/lib/models'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { SectionContext } from './context'
import { ListSection } from './ListSection'
import { ProjectPropertiesSection } from './ProjectPropertiesSection'
import { RiskSection } from './RiskSection'
import styles from './Sections.module.scss'
import { StatusSection } from './StatusSection'
import { SummarySection } from './SummarySection'
import { useCreateContextValue } from './useCreateContextValue'
import { useSections } from './useSections'

export const SectionMap = {
  [SectionType.SummarySection]: <SummarySection />,
  [SectionType.StatusSection]: <StatusSection />,
  [SectionType.ProjectPropertiesSection]: <ProjectPropertiesSection />,
  [SectionType.RiskSection]: <RiskSection />,
  [SectionType.ListSection]: <ListSection />
}

export const Sections: FC = () => {
  const context = useContext(ProjectStatusContext)
  const createContextValue = useCreateContextValue()
  const { sections } = useSections()

  if (!context.state.selectedReport) return <UserMessage text={strings.NoStatusReportsMessage} />
  return (
    <div className={styles.root}>
      {sections.map((sec, idx) => {
        return (
          <SectionContext.Provider key={idx} value={createContextValue(sec)}>
            {SectionMap[sec.type] ?? null}
          </SectionContext.Provider>
        )
      })}
    </div>
  )
}
