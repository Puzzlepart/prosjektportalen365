import { RiskElementModel } from '../../../RiskMatrix/RiskElementModel';
import { IListSectionData } from '../ListSection/IListSectionData';

export interface IRiskSectionData extends IListSectionData {
    riskElements: RiskElementModel[];
}