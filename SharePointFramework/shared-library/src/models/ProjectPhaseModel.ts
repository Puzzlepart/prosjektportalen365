import { ITermInfo } from '@pnp/sp/taxonomy'
import { ChecklistItemModel } from './ChecklistItemModel'
import _ from 'underscore'

export type ProjectPhaseChecklistData = {
  stats?: Record<string, number>
  items?: ChecklistItemModel[]
}

/**
 * Model for project phase
 */
export class ProjectPhaseModel {
  public id: string
  public checklistData: ProjectPhaseChecklistData

  /**
   * Constructor for `ProjectPhaseModel`
   *
   * @param term Term info
   * @param _termSetId Term set ID
   * @param checklistData Checklist data for the phase term
   */
  constructor(
    public term: ITermInfo,
    private _termSetId: string,
    checklistData: ProjectPhaseChecklistData
  ) {
    this.id = term.id.substring(6, 42)
    this.checklistData = checklistData ?? { stats: {}, items: [] }
  }

  public get name(): string {
    const localizedLabel = _.find(this.term.labels, l => l.languageTag === 'nb-NO')
    return localizedLabel?.name ?? this.term.labels[0].name
  }

  /**
   * Get phase term properties from the `localProperties` property using
   * the term set ID.
   */
  public get properties(): Record<string, string> {
    const { properties } = _.find(this.term.localProperties, p => p.setId === this._termSetId)
    if (!properties) return {}
    return properties.reduce((acc, p) => {
      acc[p.key] = p.value
      return acc
    }, {})
  }

  /**
   * Phase letter
   */
  public get letter() {
    if (this.properties.PhaseLetter) return this.properties.PhaseLetter
    return this.name.substring(0, 1).toUpperCase()
  }

  /**
   * Phase sub text
   *
   * Uses local custom property `PhaseSubText` from the term with
   * fallback to `PhasePurpose` to support potential legacy use.
   */
  public get subText() {
    return this.properties.PhaseSubText || this.properties.PhasePurpose
  }

  /**
   * Is visible
   *
   * Uses local custom property ShowOnFrontpage
   */
  public get isVisible(): boolean {
    try {
      return JSON.parse(this.properties.ShowOnFrontpage)
    } catch {
      return true
    }
  }

  /**
   * Returns a string representation of the phase model
   */
  public toString() {
    return `-1;#${this.name}|${this.id}`
  }

  /**
   * Get filtered phase checklist view url
   *
   * @param baseUrl base URL
   */
  public getFilteredPhaseChecklistViewUrl = (baseUrl: string): string => {
    return `${baseUrl}?FilterField1=GtProjectPhase&FilterValue1=${this.name}`
  }
}
