import { IdeaConfigurationModel } from './IdeaConfigurationModel'

describe('IdeaConfigurationModel', () => {
  it('reads the lists, the texts and the choices of a configuration', () => {
    const model = new IdeaConfigurationModel({
      Title: 'Standard',
      GtDescription: JSON.stringify({ registration: 'Anbefal', processing: 'Behandle' }),
      GtIdeaProcessingList: 'Idébehandling',
      GtIdeaRegistrationList: 'Idéregistrering',
      GtIdeaProcessingChoices: JSON.stringify({
        approve: { choice: 'Godkjenn', recommendation: 'Godkjent' }
      }),
      GtIdeaRegistrationChoices: null,
      fields: []
    })
    expect(model.processingList).toBe('Idébehandling')
    expect(model.registrationList).toBe('Idéregistrering')
    expect(model.processing).toEqual([
      { key: 'approve', choice: 'Godkjenn', recommendation: 'Godkjent' }
    ])
    expect(model.registration).toEqual([])
    // A text the configuration leaves out is empty, never missing.
    expect(model.description).toEqual({
      registration: 'Anbefal',
      processing: 'Behandle',
      projectData: ''
    })
  })

  it('has empty texts when the configuration has none', () => {
    const model = new IdeaConfigurationModel({
      Title: 'Tom',
      GtDescription: null,
      GtIdeaProcessingList: 'Idébehandling',
      GtIdeaRegistrationList: 'Idéregistrering',
      GtIdeaProcessingChoices: null,
      GtIdeaRegistrationChoices: null,
      fields: []
    })
    expect(model.description).toEqual({ registration: '', processing: '', projectData: '' })
  })
})
