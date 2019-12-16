import { RiskElementModel } from './RiskElementModel';

export interface IRiskMatrixProps {
    items?: RiskElementModel[];
    width?: number | string;
    height?: number | string;
    calloutTemplate: string;
}
