import { ITermInfo } from '@pnp/sp/taxonomy'
import { ChecklistItemModel } from './ChecklistItemModel'
import _ from 'underscore'
import { supportedLocalesMap } from '../config'

export type ProjectPhaseChecklistData = {
  stats?: Record<string, number>
  items?: ChecklistItemModel[]
}

/**
 * Model for a Project Phase.
 */
export class ProjectPhaseModel {
  public id: string
  public checklistData: ProjectPhaseChecklistData
  private _languageTag: string

  /**
   * Constructor for `ProjectPhaseModel`
   *
   * @param term Term info
   * @param _termSetId Term set ID
   * @param checklistData Checklist data for the phase term
   * @param lcid Language code ID (default: `1044`)
   */
  constructor(
    public term: ITermInfo,
    private _termSetId: string,
    checklistData: ProjectPhaseChecklistData,
    lcid: number = 1044
  ) {
    this.id = term.id
    this.checklistData = checklistData ?? { stats: {}, items: [] }
    this._languageTag = supportedLocalesMap.get(lcid)
  }

  /**
   * Phase name is the localized label of the term.
   * It uses the `lcid` property to get the correct label.
   * If the label is not found, it falls back to the first label.
   */
  public get name(): string {
    const localizedLabel = _.find(
      this.term.labels,
      (l) => l.languageTag.toLowerCase() === this._languageTag
    )
    return localizedLabel?.name ?? _.first(this.term.labels)?.name
  }

  /**
   * Get phase term properties from the `localProperties` property using
   * the term set ID.
   */
  public get properties(): Record<string, string> {
    const { properties } = _.find(this.term.localProperties, (p) => p.setId === this._termSetId)
    if (!properties) return {}
    return properties.reduce((acc, p) => {
      acc[p.key] = p.value
      return acc
    }, {})
  }

  /**
   * Phase letter is the first letter of the phase name in uppercase.
   */
  public get letter() {
    const phaseLetter = this._getLocalizedProperty('PhaseLetter')
    return phaseLetter ?? this.name.substring(0, 1).toUpperCase()
  }

  /**
   * Phase sub text
   *
   * Uses local custom property `PhaseSubText` from the term with
   * fallback to `PhasePurpose` to support potential legacy use.
   */
  public get subText() {
    return this._getLocalizedProperty('PhaseSubText') ?? this._getLocalizedProperty('PhasePurpose')
  }

  /**
   * Phase description (shown in the popover when clicking a phase)
   */
  public get description() {
    return this._getLocalizedProperty('PhaseDescription')
  }

  /**
   * Is visible on frontpage.
   *
   * Uses local custom property `ShowOnFrontpage`
   */
  public get isVisible(): boolean {
    try {
      return JSON.parse(this.properties.ShowOnFrontpage)
    } catch {
      return true
    }
  }

  /**
   * Is End Phase
   *
   * Uses local custom property `EndPhase` from the term (if set, the phase will be visible after the last visible phase)
   */
  public get isEndPhase(): boolean {
    try {
      return JSON.parse(this.properties.EndPhase)
    } catch {
      return false
    }
  }

  /**
   * Is Checklist Mandatory
   *
   * Uses local custom property `ChecklistMandatory` from the term (if set, the checklist for the phase will be mandatory)
   */
  public get isChecklistMandatory() {
    return this.properties.ChecklistMandatory
  }

  /**
   * Returns a string representation of the phase model that can
   * be used to update the term field using the `TextField` connected
   * to the field.
   */
  public toString() {
    return `-1;#${this.name}|${this.id}`
  }

  /**
   * Get filtered phase checklist view url for the phase.
   *
   * @param baseUrl base URL
   */
  public getFilteredPhaseChecklistViewUrl = (baseUrl: string): string => {
    return `${baseUrl}?FilterField1=GtProjectPhase&FilterValue1=${this.name}`
  }

  private _getLocalizedProperty = (property: string): string => {
    const propertyValue = this.properties[`${property}_${this._languageTag}`]
    if (propertyValue) {
      return propertyValue
    }
    const defaultPropertyValue = this.properties[property]
    return defaultPropertyValue
  }
}
