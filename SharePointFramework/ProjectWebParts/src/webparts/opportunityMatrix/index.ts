import * as strings from 'ProjectWebPartsStrings'
import { IOpportunityMatrixProps, OpportunityMatrix } from 'components/OpportunityMatrix'
import {
  BaseUncertaintyMatrixWebPart,
  IUncertaintyMatrixWebPartConfig
} from '../baseUncertaintyMatrixWebPart'
import { IOpportunityMatrixWebPartProps } from './types'
import resource from 'SharedResources'

export default class OpportunityMatrixWebPart extends BaseUncertaintyMatrixWebPart<IOpportunityMatrixWebPartProps> {
  protected get config(): IUncertaintyMatrixWebPartConfig {
    return {
      contentTypeName: resource.ContentTypes_Possibility_Name,
      configurationFolder: strings.OpportunityMatrixConfigurationFolder,
      defaultConfigurationSettingKey: 'OpportunityMatrixDefaultConfigurationFile',
      defaultDataSourceId: 'dc3a4676-a38a-4fa7-a2b3-790f89046b52',
      defaultDataSourceName:
        resource.Lists_DataSources_Category_UncertaintyOverview_PossibilitiesChildren
    }
  }

  public render(): void {
    this.renderMatrix<IOpportunityMatrixProps>(OpportunityMatrix)
  }
}

export * from './types'
