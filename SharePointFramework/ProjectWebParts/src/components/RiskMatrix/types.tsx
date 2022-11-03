import { PageContext } from '@microsoft/sp-page-context'
import { IMatrixElementModel } from '../DynamicMatrix/MatrixCell/MatrixElement/types'
import { HTMLProps } from 'react'
import { IDynamicMatrixContext, DynamicMatrixColorScaleConfig } from '../DynamicMatrix'

export const MATRIX_DEFAULT_COLOR_SCALE_CONFIG: DynamicMatrixColorScaleConfig[] = [
  { percentage: 10, color: [44, 186, 0] },
  { percentage: 30, color: [163, 255, 0] },
  { percentage: 50, color: [255, 244, 0] },
  { percentage: 70, color: [255, 167, 0] },
  { percentage: 90, color: [255, 0, 0] }
]

export interface IRiskMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    Pick<IDynamicMatrixContext, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
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
