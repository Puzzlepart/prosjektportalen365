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
  public processing: { key: string; choice: string; recommendation?: string }[] = []
  public registration: { key: string; choice: string; recommendation?: string }[] = []

  /**
   * Creates a new instance of TimelineConfigurationModel
   *
   * @param item SP item
   */
  constructor(item: SPIdeaConfigurationItem) {
    this.title = item.Title
    this.description = JSON.parse(item.GtDescription) || {
      registration: '',
      processing: '',
      projectData: ''
    }
    this.processingList = item.GtIdeaProcessingList
    this.registrationList = item.GtIdeaRegistrationList

    const processingChoices = JSON.parse(item.GtIdeaProcessingChoices) || {}
    const registrationChoices = JSON.parse(item.GtIdeaRegistrationChoices) || {}

    if (processingChoices && typeof processingChoices === 'object') {
      this.processing = Object.keys(processingChoices).map((key) => ({
        key,
        choice: processingChoices[key]?.choice,
        recommendation: processingChoices[key]?.recommendation
      }))
    }

    if (registrationChoices && typeof registrationChoices === 'object') {
      this.registration = Object.keys(registrationChoices).map((key) => ({
        key,
        choice: registrationChoices[key]?.choice,
        recommendation: registrationChoices[key]?.recommendation
      }))
    }
  }
}

export enum Choice {
  Approve = 'approve',
  Consideration = 'consideration',
  Reject = 'reject'
}
