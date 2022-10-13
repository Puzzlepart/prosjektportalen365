import { ICalloutProps } from '@fluentui/react/lib/Callout'
import { RiskElementModel } from '../..'

export interface IRiskElementCalloutProps extends ICalloutProps {
  risk: RiskElementModel
  calloutTemplate: string
}
