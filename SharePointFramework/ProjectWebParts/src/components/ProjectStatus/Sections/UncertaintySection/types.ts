import { UncertaintyElementModel } from 'types'
import { IListSectionData, IListSectionState } from '../ListSection'

export type IUncertaintySectionState = IListSectionState<IUncertaintySectionData>

export interface IUncertaintySectionData extends IListSectionData {
  matrixElements?: UncertaintyElementModel[]
}
