import { IListSectionProps, IListSectionState, IListSectionData } from '../ListSection'
import { IRiskMatrixProps, RiskElementModel } from 'components/RiskMatrix'

export interface IRiskSectionProps extends IListSectionProps {
  riskMatrix: IRiskMatrixProps
}

export type IRiskSectionState = IListSectionState<IRiskSectionData>

export interface IRiskSectionData extends IListSectionData {
  riskElements: RiskElementModel[]
}
