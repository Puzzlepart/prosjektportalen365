import { IBaseWebPartComponentProps } from 'components/BaseWebPartComponent/types'
import { IRiskElementProps } from 'components/RiskMatrix/RiskElement/types'

export interface IRiskMatrixWebPartProps extends IBaseWebPartComponentProps, IRiskElementProps {
    listName?: string;
    viewXml?: string;
    probabilityFieldName?: string;
    consequenceFieldName?: string;
    probabilityPostActionFieldName?: string;
    consequencePostActionFieldName?: string;
}
