import { DataAdapter } from '../../dataAdapter'
import { IRiskActionFieldCustomizerItemContext, IRiskActionFieldCustomizerProperties } from '../../types'

/**
 * Properties for the RiskAction field customizer component.
 */
export interface IRiskActionProps extends IRiskActionFieldCustomizerProperties {
  /**
   * The value of the field.
   */
  itemContext: IRiskActionFieldCustomizerItemContext
  
  /**
   * The data adapter used to interact with the SharePoint list.
   */
  dataAdapter: DataAdapter
}
