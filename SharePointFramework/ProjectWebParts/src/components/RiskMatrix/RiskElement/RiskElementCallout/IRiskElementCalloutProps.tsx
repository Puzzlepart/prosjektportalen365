import { ICalloutProps } from 'office-ui-fabric-react/lib/Callout';
import { RiskElementModel } from '../../RiskElementModel';
export interface IRiskElementCalloutProps extends ICalloutProps {
    risk: RiskElementModel;
    calloutTemplate: string;
}
