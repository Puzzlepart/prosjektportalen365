import { SectionType } from 'pp365-shared/lib/models'
import React from 'react'
import { ListSection } from './ListSection'
import { ProjectPropertiesSection } from './ProjectPropertiesSection'
import { RiskSection } from './RiskSection'
import { StatusSection } from './StatusSection'
import { SummarySection } from './SummarySection'

export const SectionMap = {
  [SectionType.SummarySection]: <SummarySection showProjectInformation />,
  [SectionType.StatusSection]: <StatusSection />,
  [SectionType.ProjectPropertiesSection]: <ProjectPropertiesSection />,
  [SectionType.RiskSection]: <RiskSection />,
  [SectionType.ListSection]: <ListSection />
}
