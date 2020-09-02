import { RiskElementModel } from '..'

export interface IRiskElementProps extends React.HTMLProps<HTMLDivElement> {
    model: RiskElementModel;
    calloutTemplate: string;
}
