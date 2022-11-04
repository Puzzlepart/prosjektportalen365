import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectWebPartsStrings'
import { HTMLProps } from 'react'
import { IDynamicMatrixProps } from '../DynamicMatrix'
import { IMatrixElementModel } from '../DynamicMatrix/MatrixCell/MatrixElement/types'

export interface IRiskMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  customConfigUrl?: string
  items?: RiskElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
}

export interface IRiskElementItem {
  Id: number
  Title: string
  [key: string]: any
}

export class RiskElementModel implements IMatrixElementModel {
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
    public item: IRiskElementItem,
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

export const RiskMatrixHeaders: Record<number, string[][]> = {
  4: [
    [
      undefined,
      strings.RiskMatrix_Header_Insignificant,
      strings.RiskMatrix_Header_Small,
      strings.RiskMatrix_Header_Moderate,
      strings.RiskMatrix_Header_Serious
    ],
    [
      strings.RiskMatrix_Header_VeryHigh,
      strings.RiskMatrix_Header_High,
      strings.RiskMatrix_Header_Medium,
      strings.RiskMatrix_Header_Low
    ]
  ],
  5: [
    [
      undefined,
      strings.RiskMatrix_Header_Insignificant,
      strings.RiskMatrix_Header_Small,
      strings.RiskMatrix_Header_Moderate,
      strings.RiskMatrix_Header_Serious,
      strings.RiskMatrix_Header_Critical
    ],
    [
      strings.RiskMatrix_Header_VeryHigh,
      strings.RiskMatrix_Header_High,
      strings.RiskMatrix_Header_Medium,
      strings.RiskMatrix_Header_Low,
      strings.RiskMatrix_Header_VeryLow
    ]
  ],
  6: [
    [
      undefined,
      strings.RiskMatrix_Header_Insignificant,
      strings.RiskMatrix_Header_Small,
      strings.RiskMatrix_Header_Moderate,
      strings.RiskMatrix_Header_Serious,
      strings.RiskMatrix_Header_Critical,
      strings.RiskMatrix_Header_VeryCritical
    ],
    [
      strings.RiskMatrix_Header_VeryHigh,
      strings.RiskMatrix_Header_High,
      strings.RiskMatrix_Header_Medium,
      strings.RiskMatrix_Header_Low,
      strings.RiskMatrix_Header_VeryLow,
      strings.RiskMatrix_Header_ExtremelyLow
    ]
  ]
}
