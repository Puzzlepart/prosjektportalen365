import { UncertaintyElementModel } from '../../../../models'
import { IListSectionData, IListSectionState } from '../ListSection'

export type IUncertaintySectionState = IListSectionState<IUncertaintySectionData>

export interface IUncertaintySectionData extends IListSectionData {
  /**
   * Matrix elements
   */
  matrixElements?: UncertaintyElementModel[]

  /**
   * Content type ID index of the first item returned. Decides which matrix to display (`RiskMatrix` or `OpportunityMatrix`)
   */
  contentTypeIndex?: number
}
