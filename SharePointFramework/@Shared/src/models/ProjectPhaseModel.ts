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

export class ProjectPhaseModel {
  public id: string
  public checklistData: ProjectPhaseChecklistData

  constructor(
    public name: string,
    id: string,
    checklistData: ProjectPhaseChecklistData,
    public properties: { [key: string]: any }
  ) {
    this.id = id.substring(6, 42)
    this.checklistData = checklistData || { stats: {}, items: [] }
  }

  /**
   * Phase letter
   */
  public get letter() {
    if(this.properties.PhaseLetter) return this.properties.PhaseLetter
    return this.name.substring(0, 1).toUpperCase()
  }

  /**
   * Phase sub text
   */
  public get subText() {
    return this.properties.PhaseSubText
  }

  /**
   * Is visible
   */
  public get isVisible() {
    return this.properties.ShowOnFrontpage !== 'false'
  }

  public toString() {
    return `-1;#${this.name}|${this.id}`
  }
}
