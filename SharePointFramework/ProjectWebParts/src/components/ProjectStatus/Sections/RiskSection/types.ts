import { RiskElementModel } from '../../../RiskMatrix'
import { IListSectionData, IListSectionState } from '../ListSection'

export type IRiskSectionState = IListSectionState<IRiskSectionData>

export interface IRiskSectionData extends IListSectionData {
  riskElements?: RiskElementModel[]
}
