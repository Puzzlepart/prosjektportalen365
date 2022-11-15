import { get } from '@microsoft/sp-lodash-subset'
import { PageContext } from '@microsoft/sp-page-context'
import { HTMLProps } from 'react'
import { IDynamicMatrixProps } from '../DynamicMatrix'
import { IMatrixElementModel } from '../DynamicMatrix/MatrixCell/MatrixElement/types'

export interface IOpportunityMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
  Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  items?: OpportunityElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
  overrideHeaderLabels?: Record<string, boolean>
  headerLabels?: Record<string, string[]>
}

export interface IOpportunityElementItem {
  Id: number
  Title: string
  [key: string]: any
}

export class OpportunityElementModel implements IMatrixElementModel {
  public id: number
  public title: string
  public probability: number
  public consequence: number
  public probabilityPostAction: number
  public consequencePostAction: number
  public action: string
  public url: string
  public webId: string
  public webUrl: string
  public siteTitle: string

  constructor(
    public item: IOpportunityElementItem,
    probability?: string,
    consequence?: string,
    probabilityPostAction?: string,
    consequencePostAction?: string
  ) {
    this.id = item.Id || item.ID
    this.title = item.Title
    this.probability = parseInt(probability || item.GtRiskProbability, 10)
    this.consequence = parseInt(consequence || item.GtRiskConsequence, 10)
    this.probabilityPostAction = parseInt(
      probabilityPostAction || item.GtRiskProbabilityPostAction,
      10
    )
    this.consequencePostAction = parseInt(
      consequencePostAction || item.GtRiskConsequencePostAction,
      10
    )
  }

  public get tooltip() {
    let tooltip = ''
    if (this.siteTitle) tooltip += `${this.siteTitle}: `
    tooltip += this.title
    return tooltip
  }
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
