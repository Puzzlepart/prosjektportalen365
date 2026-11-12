import { get } from '@microsoft/sp-lodash-subset'
import {
  OPPORTUNITY_DEFAULT_MATRIX_CONSEQUENCE_HEADERS,
  IOpportunityMatrixProps,
  OPPORTUNITY_DEFAULT_MATRIX_PROBABILITY_HEADERS
} from './types'

/** Uses an overridden axis label when enabled, otherwise the default label. */
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

/** Builds axis labels for each matrix size, with probability labels in descending order. */
export function getMatrixHeaders(props: IOpportunityMatrixProps) {
  return [4, 5, 6].reduce((headers, size) => {
    headers[size] = [
      [
        undefined,
        ...[...OPPORTUNITY_DEFAULT_MATRIX_CONSEQUENCE_HEADERS]
          .splice(0, size)
          .map((defaultHeader, index) =>
            getHeaderLabel(props, size.toString(), `c${index}`, defaultHeader)
          )
      ],
      [...OPPORTUNITY_DEFAULT_MATRIX_PROBABILITY_HEADERS]
        .splice(0, size)
        .map((defaultHeader, index) =>
          getHeaderLabel(props, size.toString(), `p${index}`, defaultHeader)
        )
        .reverse()
    ]
    return headers
  }, {})
}
