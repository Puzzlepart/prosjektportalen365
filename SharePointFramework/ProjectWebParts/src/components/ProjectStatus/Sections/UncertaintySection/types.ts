import { RiskElementModel } from '../../../RiskMatrix'
import { IListSectionData, IListSectionState } from '../ListSection'

export type IUncertaintySectionState = IListSectionState<IUncertaintySectionData>

export interface IUncertaintySectionData extends IListSectionData {
  riskElements?: RiskElementModel[]
}
