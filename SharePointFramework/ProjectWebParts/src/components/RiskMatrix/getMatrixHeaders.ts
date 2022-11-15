import { get } from '@microsoft/sp-lodash-subset'
import strings from 'ProjectWebPartsStrings'
import { IRiskMatrixProps } from './types'

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
  const headers: Record<number, string[][]> = {}
  headers[4] = [
    [
      undefined,
      getHeaderLabel(props, '4', 'c0', strings.MatrixHeader_Insignificant),
      getHeaderLabel(props, '4', 'c1', strings.MatrixHeader_Small),
      getHeaderLabel(props, '4', 'c2', strings.MatrixHeader_Moderate),
      getHeaderLabel(props, '4', 'c3', strings.MatrixHeader_Serious)
    ],
    [
      getHeaderLabel(props, '4', 'p0', strings.MatrixHeader_VeryHigh),
      getHeaderLabel(props, '4', 'p1', strings.MatrixHeader_High),
      getHeaderLabel(props, '4', 'p2', strings.MatrixHeader_Medium),
      getHeaderLabel(props, '4', 'p3', strings.MatrixHeader_Low)
    ]
  ]
  headers[5] = [
    [
      undefined,
      getHeaderLabel(props, '5', 'c0', strings.MatrixHeader_Insignificant),
      getHeaderLabel(props, '5', 'c1', strings.MatrixHeader_Small),
      getHeaderLabel(props, '5', 'c2', strings.MatrixHeader_Moderate),
      getHeaderLabel(props, '5', 'c3', strings.MatrixHeader_Serious),
      getHeaderLabel(props, '5', 'c4', strings.MatrixHeader_Critical)
    ],
    [
      getHeaderLabel(props, '5', 'p0', strings.MatrixHeader_VeryHigh),
      getHeaderLabel(props, '5', 'p1', strings.MatrixHeader_High),
      getHeaderLabel(props, '5', 'p2', strings.MatrixHeader_Medium),
      getHeaderLabel(props, '5', 'p3', strings.MatrixHeader_Low),
      getHeaderLabel(props, '5', 'p4', strings.MatrixHeader_VeryLow)
    ]
  ]
  headers[6] = [
    [
      undefined,
      getHeaderLabel(props, '6', 'c0', strings.MatrixHeader_Insignificant),
      getHeaderLabel(props, '6', 'c1', strings.MatrixHeader_Small),
      getHeaderLabel(props, '6', 'c2', strings.MatrixHeader_Moderate),
      getHeaderLabel(props, '6', 'c3', strings.MatrixHeader_Serious),
      getHeaderLabel(props, '6', 'c4', strings.MatrixHeader_Critical),
      getHeaderLabel(props, '6', 'c5', strings.MatrixHeader_VeryCritical)
    ],
    [
      getHeaderLabel(props, '6', 'p0', strings.MatrixHeader_VeryHigh),
      getHeaderLabel(props, '6', 'p1', strings.MatrixHeader_High),
      getHeaderLabel(props, '6', 'p2', strings.MatrixHeader_Medium),
      getHeaderLabel(props, '6', 'p3', strings.MatrixHeader_Low),
      getHeaderLabel(props, '6', 'p4', strings.MatrixHeader_VeryLow),
      getHeaderLabel(props, '6', 'p5', strings.MatrixHeader_ExtremelyLow)
    ]
  ]
  return headers
}
