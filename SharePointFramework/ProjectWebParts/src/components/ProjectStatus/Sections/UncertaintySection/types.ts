import { UncertaintyElementModel } from '../../../../models'
import { IListSectionData, IListSectionState } from '../ListSection'

/** Loading and persisted-data state for a risk or opportunity section. */
export type IUncertaintySectionState = IListSectionState<IUncertaintySectionData>

/** List section data enriched with uncertainty matrix elements and type. */
export interface IUncertaintySectionData extends IListSectionData {
  matrixElements?: UncertaintyElementModel[]

  /**
   * Content type ID index of the first item returned. Decides which matrix to display (`RiskMatrix` or `OpportunityMatrix`)
   */
  contentTypeIndex?: number
}
