import { get } from '@microsoft/sp-lodash-subset'
import {
  IRiskMatrixProps,
  RISK_MATRIX_DEFAULT_CONSEQUENCE_HEADERS,
  RISK_MATRIX_DEFAULT_PROBABILITY_HEADERS
} from './types'

/**
 * Get header label for a matrix size.
 *
 * @param props Props for the RiskMatrix component
 * @param size Matrix size (4, 5 or 6)
 * @param headerName Header name
 * @param fallbackHeaderLabel Fallback header label
 */
function getHeaderLabel(
  props: IRiskMatrixProps,
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
export function getMatrixHeaders(props: IRiskMatrixProps): Record<number, string[][]> {
  return [4, 5, 6].reduce((headers, size) => {
    headers[size] = [
      [
        undefined,
        ...[...RISK_MATRIX_DEFAULT_CONSEQUENCE_HEADERS]
          .splice(0, size)
          .map((defaultHeader, index) =>
            getHeaderLabel(props, size.toString(), `c${index}`, defaultHeader)
          )
      ],
      [...RISK_MATRIX_DEFAULT_PROBABILITY_HEADERS]
        .splice(0, size)
        .map((defaultHeader, index) =>
          getHeaderLabel(props, size.toString(), `p${index}`, defaultHeader)
        )
        .reverse()
    ]
    return headers
  }, {})
}
