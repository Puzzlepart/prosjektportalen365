import { SectionModel, StatusReport } from 'pp365-shared-library/lib/models'
import { createContext } from 'react'
import { IStatusElement } from '../StatusElement/types'

/** Section configuration, status header and persisted section data. */
export interface ISectionContext {
  section?: SectionModel

  headerProps?: IStatusElement

  report?: StatusReport
}

/** Shares the current report section's configuration and status with its children. */
export const SectionContext = createContext<ISectionContext>(null)
