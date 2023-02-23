import { get } from '@microsoft/sp-lodash-subset'
import {
  OPPORTUNITY_DEFAULT_MATRIX_CONSEQUENCE_HEADERS,
  IOpportunityMatrixProps,
  OPPORTUNITY_DEFAULT_MATRIX_PROBABILITY_HEADERS
} from './types'

/**
 * Get header label for a matrix size.
 *
 * @param props Props for the OpportunityMatrix component
 * @param size Matrix size (4, 5 or 6)
 * @param headerName Header name
 * @param fallbackHeaderLabel Fallback header label
 */
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
 * Generates a matrix header configuration for each matrix size (4x4, 5x5, 6x6). The probability headers
 * will be reversed, so that the highest probability is at the top of the matrix.
 *
 * @param props Component props
 */
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
