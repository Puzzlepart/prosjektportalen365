import _ from 'lodash'
import { t9r } from '../../../util'
import { IDialogColumnProps } from './types'

/**
 * Interpolates and capitalizes optional dialog information text using the item's fields.
 */
export function useInfoText(props: IDialogColumnProps) {
  if (!props.showInfoText) return null
  return _.capitalize(t9r(props.infoTextTemplate, props.item))
}
