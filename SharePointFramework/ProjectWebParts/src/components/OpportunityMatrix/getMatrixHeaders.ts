import { get } from '@microsoft/sp-lodash-subset'
import {
  OPPORTUNITY_MATRIX_CONSEQUENCE_HEADERS,
  IOpportunityMatrixProps,
  OPPORTUNITY_MATRIX_PROBABILITY_HEADERS
} from './types'

function getHeaderLabel(
  props: IOpportunityMatrixProps,
  size: string,
  headerName: string,
  fallbackHeaderLabel: string
) {
  return get(props, `overrideHeaderLabels[${size}]`) &&
    get(props, `headerLabels[${size}][${headerName}]`)
    ? get(props, `headerLabels[${size}][${headerName}]`)
    : fallbackHeaderLabel
}

/**
 * Get matrix headers. Either header labels configured by users, or default values.
 *
 * @param props Component props
 */
export function getMatrixHeaders(props: IOpportunityMatrixProps) {
  return [4, 5, 6].reduce((headers, size) => {
    headers[size] = [
      [
        undefined,
        ...[...OPPORTUNITY_MATRIX_PROBABILITY_HEADERS]
          .splice(0, size)
          .map((header, index) => getHeaderLabel(props, size.toString(), `c${index}`, header))
      ],
      [...OPPORTUNITY_MATRIX_CONSEQUENCE_HEADERS]
        .splice(0, size)
        .map((header, index) => getHeaderLabel(props, size.toString(), `p${index}`, header))
    ]
    return headers
  }, {})
}
