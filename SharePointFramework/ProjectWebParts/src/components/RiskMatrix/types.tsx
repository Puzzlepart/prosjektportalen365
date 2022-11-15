import { get } from '@microsoft/sp-lodash-subset'
import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectWebPartsStrings'
import { HTMLProps } from 'react'
import { IDynamicMatrixProps } from '../DynamicMatrix'
import { UncertaintyElementModel } from 'types/UncertaintyElementModel'

export interface IRiskMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  customConfigUrl?: string
  items?: UncertaintyElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
  overrideHeaderLabels?: Record<string, boolean>
  headerLabels?: Record<string, string[]>
}

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

export function RiskMatrixHeaders(props: IRiskMatrixProps): Record<number, string[][]> {
  const fourByFour = [
    [
      undefined,
      getHeaderLabel(props, '4', 'c0', strings.RiskMatrix_Header_Insignificant),
      getHeaderLabel(props, '4', 'c1', strings.RiskMatrix_Header_Small),
      getHeaderLabel(props, '4', 'c2', strings.RiskMatrix_Header_Moderate),
      getHeaderLabel(props, '4', 'c3', strings.RiskMatrix_Header_Serious)
    ],
    [
      getHeaderLabel(props, '4', 'p0', strings.RiskMatrix_Header_VeryHigh),
      getHeaderLabel(props, '4', 'p1', strings.RiskMatrix_Header_High),
      getHeaderLabel(props, '4', 'p2', strings.RiskMatrix_Header_Medium),
      getHeaderLabel(props, '4', 'p3', strings.RiskMatrix_Header_Low)
    ]
  ]
  const fiveByFive = [
    [
      undefined,
      getHeaderLabel(props, '5', 'c0', strings.RiskMatrix_Header_Insignificant),
      getHeaderLabel(props, '5', 'c1', strings.RiskMatrix_Header_Small),
      getHeaderLabel(props, '5', 'c2', strings.RiskMatrix_Header_Moderate),
      getHeaderLabel(props, '5', 'c3', strings.RiskMatrix_Header_Serious),
      getHeaderLabel(props, '5', 'c4', strings.RiskMatrix_Header_Critical)
    ],
    [
      getHeaderLabel(props, '5', 'p0', strings.RiskMatrix_Header_VeryHigh),
      getHeaderLabel(props, '5', 'p1', strings.RiskMatrix_Header_High),
      getHeaderLabel(props, '5', 'p2', strings.RiskMatrix_Header_Medium),
      getHeaderLabel(props, '5', 'p3', strings.RiskMatrix_Header_Low),
      getHeaderLabel(props, '5', 'p4', strings.RiskMatrix_Header_VeryLow)
    ]
  ]
  const sixBySix = [
    [
      undefined,
      getHeaderLabel(props, '6', 'c0', strings.RiskMatrix_Header_Insignificant),
      getHeaderLabel(props, '6', 'c1', strings.RiskMatrix_Header_Small),
      getHeaderLabel(props, '6', 'c2', strings.RiskMatrix_Header_Moderate),
      getHeaderLabel(props, '6', 'c3', strings.RiskMatrix_Header_Serious),
      getHeaderLabel(props, '6', 'c4', strings.RiskMatrix_Header_Critical),
      getHeaderLabel(props, '6', 'c5', strings.RiskMatrix_Header_VeryCritical)
    ],
    [
      getHeaderLabel(props, '6', 'p0', strings.RiskMatrix_Header_VeryHigh),
      getHeaderLabel(props, '6', 'p1', strings.RiskMatrix_Header_High),
      getHeaderLabel(props, '6', 'p2', strings.RiskMatrix_Header_Medium),
      getHeaderLabel(props, '6', 'p3', strings.RiskMatrix_Header_Low),
      getHeaderLabel(props, '6', 'p4', strings.RiskMatrix_Header_VeryLow),
      getHeaderLabel(props, '6', 'p5', strings.RiskMatrix_Header_ExtremelyLow)
    ]
  ]
  return {
    4: fourByFour,
    5: fiveByFive,
    6: sixBySix
  }
}
