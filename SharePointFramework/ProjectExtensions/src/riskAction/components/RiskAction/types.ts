import {
  IRiskActionFieldCustomizerItemContext,
  IRiskActionFieldCustomizerProperties
} from '../../types'

/**
 * Properties for the RiskAction field customizer component.
 */
export interface IRiskActionProps extends IRiskActionFieldCustomizerProperties {
  /**
   * The value of the field.
   */
  itemContext: IRiskActionFieldCustomizerItemContext
}
