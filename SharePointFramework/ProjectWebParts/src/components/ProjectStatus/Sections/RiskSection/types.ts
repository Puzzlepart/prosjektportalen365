import { RiskElementModel } from 'components/RiskMatrix'
import { IListSectionData, IListSectionState } from '../ListSection'

export type IRiskSectionState = IListSectionState<IRiskSectionData>

export interface IRiskSectionData extends IListSectionData {
  riskElements: RiskElementModel[]
}
