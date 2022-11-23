import { get } from '@microsoft/sp-lodash-subset'
import {
  IRiskMatrixProps,
  RISK_MATRIX_CONSEQUENCE_HEADERS,
  RISK_MATRIX_PROBABILITY_HEADERS
} from './types'

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
 * @param props Component props
 */

export function getMatrixHeaders(props: IRiskMatrixProps): Record<number, string[][]> {
  return [4, 5, 6].reduce((headers, size) => {
    headers[size] = [
      [
        undefined,
        ...[...RISK_MATRIX_PROBABILITY_HEADERS]
          .splice(0, size)
          .map((header, index) => getHeaderLabel(props, size.toString(), `c${index}`, header))
      ],
      [...RISK_MATRIX_CONSEQUENCE_HEADERS]
        .splice(0, size)
        .map((header, index) => getHeaderLabel(props, size.toString(), `p${index}`, header))
    ]
    return headers
  }, {})
}
