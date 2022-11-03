import { PageContext } from '@microsoft/sp-page-context'
import { HTMLProps } from 'react'
import { IMatrixCell } from './MatrixCell/types'

type RGB = [number, number, number]

export type ColorScaleConfig = { percentage: number; color: RGB }

export const DEFAULT_COLOR_SCALE_CONFIG: ColorScaleConfig[] = [
  { percentage: 10, color: [44, 186, 0] },
  { percentage: 30, color: [163, 255, 0] },
  { percentage: 50, color: [255, 244, 0] },
  { percentage: 70, color: [255, 167, 0] },
  { percentage: 90, color: [255, 0, 0] }
]

export interface IRiskMatrixProps extends Omit<HTMLProps<HTMLDivElement>, 'size'> {
  customConfigUrl?: string
  size?: RiskMatrixSize
  items?: RiskElementModel[]
  width?: number | string
  height?: number | string
  calloutTemplate: string
  pageContext?: PageContext
  colorConfig?: ColorScaleConfig[]
}

export type RiskMatrixSize = '4' | '5' | '6'

export type RiskMatrixConfiguration = IMatrixCell[][]

export interface IRiskElementItem {
  Id: number
  Title: string
  [key: string]: any
}

export class RiskElementModel {
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
}
