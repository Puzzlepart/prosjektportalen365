import { IConfigurationFile } from 'types'
import { IBaseWebPartComponentProps } from '../../components/BaseWebPartComponent/types'
import { IRiskMatrixProps } from '../../components/RiskMatrix'
import { UncertaintyElementModel } from 'models'

export interface IRiskMatrixWebPartProps extends IBaseWebPartComponentProps, IRiskMatrixProps {
  listName?: string
  viewXml?: string
  probabilityFieldName?: string
  consequenceFieldName?: string
  probabilityPostActionFieldName?: string
  consequencePostActionFieldName?: string
}

export interface IRiskMatrixWebPartData {
  items?: UncertaintyElementModel[]
  configurations?: IConfigurationFile[]
  defaultConfiguration?: IConfigurationFile
}
