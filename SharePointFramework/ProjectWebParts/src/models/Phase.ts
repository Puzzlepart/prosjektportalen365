import { PhaseChecklistData } from '../types/PhaseChecklistData'

export class Phase {
  public id: string
  public letter: string
  public checklistData: PhaseChecklistData
  public properties: { [key: string]: any }

  constructor(
    public name: string,
    id: string,
    checklistData: PhaseChecklistData,
    properties: { [key: string]: any }
  ) {
    this.id = id.substring(6, 42)
    this.letter = this.name.substring(0, 1).toUpperCase()
    this.checklistData = checklistData || { stats: {}, items: [] }
    this.properties = properties
  }

  public toString() {
    return `-1;#${this.name}|${this.id}`
  }
}
