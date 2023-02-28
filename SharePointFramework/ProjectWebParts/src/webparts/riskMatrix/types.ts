import { IBaseWebPartComponentProps } from '../../components/BaseWebPartComponent/types'
import { IRiskMatrixProps } from '../../components/RiskMatrix'

export interface IRiskMatrixWebPartProps extends IBaseWebPartComponentProps, IRiskMatrixProps {
  listName?: string
  viewXml?: string
  probabilityFieldName?: string
  consequenceFieldName?: string
  probabilityPostActionFieldName?: string
  consequencePostActionFieldName?: string
}
