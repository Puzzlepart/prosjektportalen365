import { IMatrixElementModel } from '../components/DynamicMatrix/MatrixCell/MatrixElement/types'

export class UncertaintyElementModel
  implements IMatrixElementModel<Record<string, any>>
{
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
    public item: Record<string, any>,
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
