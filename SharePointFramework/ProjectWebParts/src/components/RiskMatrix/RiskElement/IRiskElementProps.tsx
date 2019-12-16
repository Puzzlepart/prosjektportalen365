import { RiskElementModel } from '../RiskElementModel';

export interface IRiskElementProps extends React.HTMLProps<HTMLDivElement> {
    model: RiskElementModel;
    calloutTemplate: string;
}
