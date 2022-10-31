import { TypedHash } from '@pnp/common'

export type ProjectPhaseChecklistData = {
  stats?: {
    [status: string]: number
  }
  items?: IProjectPhaseChecklistItem[]
}

export interface IProjectPhaseChecklistItem {
  ID: number
  Title: string
  GtComment: string
  GtChecklistStatus: string
  GtProjectPhase: {
    TermGuid: string
  }
}

/**
 * Model for projet phase
 */
export class ProjectPhaseModel {
  public id: string
  public checklistData: ProjectPhaseChecklistData

  /**
   * Constructor
   *
   * @param name Term name
   * @param termId Term ID
   * @param checklistData Checklist data
   * @param properties Properties
   */
  constructor(
    public name: string,
    termId: string,
    checklistData: ProjectPhaseChecklistData,
    public properties: TypedHash<any>
  ) {
    this.id = termId.substring(6, 42)
    this.checklistData = checklistData || { stats: {}, items: [] }
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
   * Uses local custom property PhaseSubText from the term with
   * fallback to PhasePurpose to support potential legacy use.
   */
  public get subText() {
    return this.properties.PhaseSubText || this.properties.PhasePurpose
  }

  /**
   * Is visible
   *
   * Uses local custom property ShowOnFrontpage
   */
  public get isVisible() {
    return this.properties.ShowOnFrontpage !== 'false'
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
