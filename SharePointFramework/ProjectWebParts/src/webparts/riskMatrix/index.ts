import * as strings from 'ProjectWebPartsStrings'
import { IRiskMatrixProps, RiskMatrix } from 'components/RiskMatrix'
import {
  BaseUncertaintyMatrixWebPart,
  IUncertaintyMatrixWebPartConfig
} from '../baseUncertaintyMatrixWebPart'
import { IRiskMatrixWebPartProps } from './types'
import resource from 'SharedResources'

export default class RiskMatrixWebPart extends BaseUncertaintyMatrixWebPart<IRiskMatrixWebPartProps> {
  protected get config(): IUncertaintyMatrixWebPartConfig {
    return {
      contentTypeName: resource.ContentTypes_Risk_Name,
      configurationFolder: strings.RiskMatrixConfigurationFolder,
      defaultConfigurationSettingKey: 'RiskMatrixDefaultConfigurationFile',
      defaultDataSourceId: 'b0ef3852-230e-4119-8156-5a2ba625e5e1',
      defaultDataSourceName: resource.Lists_DataSources_Category_UncertaintyOverview_RisksChildren
    }
  }

  public render(): void {
    this.renderMatrix<IRiskMatrixProps>(RiskMatrix)
  }
}

export * from './types'
