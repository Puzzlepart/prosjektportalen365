import { IListSectionProps } from '../ListSection/IListSectionProps'
import { IRiskMatrixProps } from 'components/RiskMatrix'

export interface IRiskSectionProps extends IListSectionProps {
    riskMatrix: IRiskMatrixProps;
}
