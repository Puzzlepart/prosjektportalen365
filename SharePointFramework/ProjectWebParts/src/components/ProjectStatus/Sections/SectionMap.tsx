import { SectionType } from 'pp365-shared-library/lib/models'
import React from 'react'
import { ListSection } from './ListSection/ListSection'
import { ProjectPropertiesSection } from './ProjectPropertiesSection/ProjectPropertiesSection'
import { UncertaintySection } from './UncertaintySection/UncertaintySection'
import { StatusSection } from './StatusSection/StatusSection'
import { SummarySection } from './SummarySection/SummarySection'

/**
 * A mapping of section types to their corresponding React components.
 */
export const SectionMap = {
  [SectionType.SummarySection]: <SummarySection showProjectInformation />,
  [SectionType.StatusSection]: <StatusSection />,
  [SectionType.ProjectPropertiesSection]: <ProjectPropertiesSection />,
  [SectionType.UncertaintySection]: <UncertaintySection />,
  [SectionType.ListSection]: <ListSection />
}

export { SummarySection, StatusSection, ProjectPropertiesSection, UncertaintySection, ListSection }
