import { get } from '@microsoft/sp-lodash-subset'
import {
  IRiskMatrixProps,
  RISK_MATRIX_DEFAULT_CONSEQUENCE_HEADERS,
  RISK_MATRIX_DEFAULT_PROBABILITY_HEADERS
} from './types'

/** Uses an overridden axis label when enabled, otherwise the default label. */
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

/** Builds axis labels for each matrix size, with probability labels in descending order. */
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
