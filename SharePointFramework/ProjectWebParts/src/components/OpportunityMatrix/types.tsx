import { get } from '@microsoft/sp-lodash-subset'
import { PageContext } from '@microsoft/sp-page-context'
import { HTMLProps } from 'react'
import { UncertaintyElementModel } from 'types'
import { IDynamicMatrixProps } from '../DynamicMatrix'

export interface IOpportunityMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
  Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  items?: UncertaintyElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
  overrideHeaderLabels?: Record<string, boolean>
  headerLabels?: Record<string, string[]>
}

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

export function OpportunityMatrixHeaders(props: IOpportunityMatrixProps): Record<number, string[][]> {
  const fourByFour = [
    [
      undefined,
      getHeaderLabel(props, '4', 'c0', ''),
      getHeaderLabel(props, '4', 'c1', ''),
      getHeaderLabel(props, '4', 'c2', ''),
      getHeaderLabel(props, '4', 'c3', '')
    ],
    [
      getHeaderLabel(props, '4', 'p0', ''),
      getHeaderLabel(props, '4', 'p1', ''),
      getHeaderLabel(props, '4', 'p2', ''),
      getHeaderLabel(props, '4', 'p3', '')
    ]
  ]
  const fiveByFive = [
    [
      undefined,
      getHeaderLabel(props, '5', 'c0', ''),
      getHeaderLabel(props, '5', 'c1', ''),
      getHeaderLabel(props, '5', 'c2', ''),
      getHeaderLabel(props, '5', 'c3', ''),
      getHeaderLabel(props, '5', 'c4', '')
    ],
    [
      getHeaderLabel(props, '5', 'p0', ''),
      getHeaderLabel(props, '5', 'p1', ''),
      getHeaderLabel(props, '5', 'p2', ''),
      getHeaderLabel(props, '5', 'p3', ''),
      getHeaderLabel(props, '5', 'p4', '')
    ]
  ]
  const sixBySix = [
    [
      undefined,
      getHeaderLabel(props, '6', 'c0', ''),
      getHeaderLabel(props, '6', 'c1', ''),
      getHeaderLabel(props, '6', 'c2', ''),
      getHeaderLabel(props, '6', 'c3', ''),
      getHeaderLabel(props, '6', 'c4', ''),
      getHeaderLabel(props, '6', 'c5', '')
    ],
    [
      getHeaderLabel(props, '6', 'p0', ''),
      getHeaderLabel(props, '6', 'p1', ''),
      getHeaderLabel(props, '6', 'p2', ''),
      getHeaderLabel(props, '6', 'p3', ''),
      getHeaderLabel(props, '6', 'p4', ''),
      getHeaderLabel(props, '6', 'p5', '')
    ]
  ]
  return {
    4: fourByFour,
    5: fiveByFive,
    6: sixBySix
  }
}
