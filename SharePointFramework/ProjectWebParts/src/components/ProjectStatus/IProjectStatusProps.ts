import { IBaseWebPartComponentProps } from '../BaseWebPartComponent';

export interface IProjectStatusProps extends IBaseWebPartComponentProps {
    riskMatrixCalloutTemplate: string;
    riskMatrixWidth?: number | string;
    riskMatrixHeight?: number | string;
}
