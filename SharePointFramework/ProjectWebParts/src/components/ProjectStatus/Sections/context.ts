import { SectionModel, StatusReport } from 'pp365-shared-library/lib/models'
import { createContext } from 'react'
import { IStatusElement } from '../StatusElement/types'

export interface ISectionContext {
  /**
   * Section model
   */
  section?: SectionModel

  /**
   * Props for section header
   */
  headerProps?: IStatusElement

  /**
   * The selected report
   */
  report?: StatusReport
}

export const SectionContext = createContext<ISectionContext>(null)
