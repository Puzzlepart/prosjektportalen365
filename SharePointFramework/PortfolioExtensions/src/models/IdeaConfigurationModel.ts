/* eslint-disable max-classes-per-file */

export class SPIdeaConfigurationItem {
  public Title: string = ''
  public GtDescription: string = null
  public GtIdeaProcessingList: string = 'Idébehandling'
  public GtIdeaRegistrationList: string = 'Idéregistrering'
  public GtIdeaProcessingChoices: string = null
  public GtIdeaRegistrationChoices: string = null
  public get fields(): string[] {
    return Object.keys(this)
  }
}

export class IdeaConfigurationModel {
  public title: string
  public description: { registration: string; processing: string; projectData: string }
  public processingList: string
  public registrationList: string
  public processing: { key: string; choice: string; recommendation: string }[] = []
  public registration: { key: string; choice: string; recommendation: string }[] = []

  /**
   * Creates a new instance of TimelineConfigurationModel
   *
   * @param item SP item
   */
  constructor(item: SPIdeaConfigurationItem) {
    this.title = item.Title
    this.description = JSON.parse(item.GtDescription)
    this.processingList = item.GtIdeaProcessingList
    this.registrationList = item.GtIdeaRegistrationList
    this.processing = Object.keys(item.GtIdeaProcessingChoices).map((key) => ({
      key,
      choice: item.GtIdeaProcessingChoices[key].choice,
      recommendation: item.GtIdeaProcessingChoices[key].recommendation
    }))
    this.registration = Object.keys(item.GtIdeaRegistrationChoices).map((key) => ({
      key,
      choice: item.GtIdeaRegistrationChoices[key].choice,
      recommendation: item.GtIdeaRegistrationChoices[key].recommendation
    }))
  }
}

export enum Choice {
  Approve = 'approve',
  Consideration = 'consideration',
  Reject = 'reject'
}
