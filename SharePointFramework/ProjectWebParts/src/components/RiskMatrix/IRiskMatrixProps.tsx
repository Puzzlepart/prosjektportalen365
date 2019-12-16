import { RiskElementModel } from './RiskElementModel';
import { IRiskMatrixWebPartProps } from 'webparts/riskMatrix/IRiskMatrixWebPartProps';

export interface IRiskMatrixProps extends IRiskMatrixWebPartProps {
    items: RiskElementModel[];
}
