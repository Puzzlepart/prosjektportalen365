import resource from 'SharedResources'

/** SharePoint fields storing idea-workflow lists, messages and choice definitions. */
export class SPIdeaConfigurationItem {
  public Title: string = ''
  public GtDescription: string = null
  public GtIdeaProcessingList: string = resource.Lists_IdeaProcessing_Title
  public GtIdeaRegistrationList: string = resource.Lists_IdeaRegistration_Title
  public GtIdeaProcessingChoices: string = null
  public GtIdeaRegistrationChoices: string = null
  public get fields(): string[] {
    return Object.keys(this)
  }
}

/** Parses the idea configuration's JSON messages and choices for the dialogs. */
export class IdeaConfigurationModel {
  public title: string
  public description: { registration: string; processing: string; projectData: string }
  public processingList: string
  public registrationList: string
  public processing: { key: string; choice: string; recommendation?: string }[] = []
  public registration: { key: string; choice: string; recommendation?: string }[] = []

  constructor(item: SPIdeaConfigurationItem) {
    this.title = item.Title
    // A configuration may leave a text out (one made before `projectData` existed, say); the
    // dialogs then show none rather than failing on it.
    this.description = {
      registration: '',
      processing: '',
      projectData: '',
      ...JSON.parse(item.GtDescription)
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

/** Decision values shared by the idea registration and processing flows. */
export enum Choice {
  Approve = 'approve',
  Consideration = 'consideration',
  Reject = 'reject'
}
