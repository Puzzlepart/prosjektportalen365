import _ from 'lodash'
import { t9r } from 'pp365-shared-library'
import { IDialogColumnProps } from './types'

/**
 * Get info text for `<DialogColumn />` component. If `showInfoText` is `true`,
 * then `infoTextTemplate` is used to generate the info text using `t9r` util
 * function with `props.item` as the template data. The `infoTextTemplate` is
 * used as the template string for `t9r`.
 */
export function useInfoText(props: IDialogColumnProps) {
  if (!props.showInfoText) return null
  return _.capitalize(t9r(props.infoTextTemplate, props.item))
}
