/* eslint-disable max-classes-per-file */

export class SPIdeaConfigurationItem {
  public Title: string = ''
  public GtDescription: string = null
  public GtIdeaProcessingList: string = 'Idébehandling'
  public GtIdeaRegistrationList: string = 'Idéregistrering'
  public get fields(): string[] {
    return Object.keys(this)
  }
}

export class IdeaConfigurationModel {
  public title: string
  public description: string
  public processingList: string
  public registrationList: string

  /**
   * Creates a new instance of TimelineConfigurationModel
   *
   * @param item SP item
   */
  constructor(item: SPIdeaConfigurationItem) {
    this.title = item.Title
    this.description = item.GtDescription
    this.processingList = item.GtIdeaProcessingList
    this.registrationList = item.GtIdeaRegistrationList
  }
}
