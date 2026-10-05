import strings from 'ProjectExtensionsStrings'
import createReducer, {
  INIT,
  ON_CLOUD_TEMPLATE_ERROR,
  ON_CLOUD_TEMPLATE_RESOLVED,
  ON_CLOUD_TEMPLATE_RESOLVING,
  ON_EXTENSIONS_CHANGED,
  ON_LIST_CONTENT_CONFIG_CHANGED,
  ON_TEMPLATE_CHANGED,
  initialState
} from './reducer'
import {
  CONTENT_CONFIG,
  EXTENSIONS,
  contentConfig,
  extension,
  setupData,
  template
} from './testFixtures'

const texts = (items: { text: string }[]) => items.map(({ text }) => text)

describe('ProjectSetupDialog reducer', () => {
  it('starts with the default template and its selection', () => {
    const state = createReducer(setupData())(initialState, INIT())
    expect(state.selectedTemplate.text).toBe('Standardmal')
    expect(texts(state.selectedExtensions)).toEqual(['Gevinstoversikt'])
    expect(texts(state.selectedContentConfig)).toEqual(['Fasesjekkliste'])
  })

  it('starts with the first template when none is the default', () => {
    const state = createReducer(
      setupData({ templates: [template(7, 'Første'), template(8, 'Andre')] })
    )(initialState, INIT())
    expect(state.selectedTemplate.text).toBe('Første')
  })

  it('starts with no template on a project that has one already', () => {
    const state = createReducer(setupData({ hasExistingTemplate: true }))(initialState, INIT())
    expect(state.selectedTemplate.text).toBe(strings.ProjectTemplateSelectorNoTemplateLabel)
    expect(state.selectedExtensions).toEqual([])
  })

  it('keeps what the template makes mandatory whatever else is picked', () => {
    const mandatory = extension(3, 'Påkrevd', { mandatoryFor: [1] })
    const mandatoryContent = contentConfig(12, 'Påkrevd innhold', { mandatoryFor: [1] })
    const reducer = createReducer(
      setupData({
        extensions: [...EXTENSIONS, mandatory],
        contentConfig: [...CONTENT_CONFIG, mandatoryContent]
      })
    )
    let state = reducer(initialState, INIT())
    state = reducer(state, ON_EXTENSIONS_CHANGED([EXTENSIONS[1]]))
    expect(texts(state.selectedExtensions)).toEqual(['Påkrevd', 'Risikomatrise'])
    state = reducer(state, ON_LIST_CONTENT_CONFIG_CHANGED([CONTENT_CONFIG[1], mandatoryContent]))
    expect(texts(state.selectedContentConfig)).toEqual(['Påkrevd innhold', 'Planner'])
  })

  it("replaces the selection with a template's own when the template changes", () => {
    const reducer = createReducer(setupData())
    const state = reducer(
      reducer(initialState, INIT()),
      ON_TEMPLATE_CHANGED(setupData().templates[1])
    )
    expect(state.selectedTemplate.text).toBe('Byggeprosjekt')
    expect(texts(state.selectedExtensions)).toEqual(['Risikomatrise'])
    expect(texts(state.selectedContentConfig)).toEqual(['Fasesjekkliste', 'Planner'])
  })

  it('selects from the package of a cloud template once it is read, never from a stale one', () => {
    const cloud = template(3, 'Skymal', { isCloudTemplate: true })
    const reducer = createReducer(setupData())
    let state = reducer(reducer(initialState, INIT()), ON_TEMPLATE_CHANGED(cloud))
    expect(state.selectedExtensions).toEqual([])
    state = reducer(state, ON_CLOUD_TEMPLATE_RESOLVING())
    expect(state.isResolvingCloudTemplate).toBe(true)

    const hidden = { ...extension(6, 'Skjult'), hidden: true }
    const hiddenButMandatory = { ...extension(7, 'Låst', { mandatoryFor: [3] }), hidden: true }
    const resolved = {
      templateId: 3,
      package: {} as any,
      extensions: [extension(5, 'Skytillegg'), hidden, hiddenButMandatory],
      contentConfig: [contentConfig(15, 'Skyinnhold')]
    }
    expect(reducer(state, ON_CLOUD_TEMPLATE_RESOLVED({ ...resolved, templateId: 2 }))).toEqual(
      state
    )
    state = reducer(state, ON_CLOUD_TEMPLATE_RESOLVED(resolved))
    expect(state.isResolvingCloudTemplate).toBe(false)
    expect(texts(state.selectedExtensions)).toEqual(['Skytillegg', 'Låst'])
    expect(texts(state.selectedContentConfig)).toEqual(['Skyinnhold'])

    // Picks within a cloud template keep to its package's mandatory items.
    state = reducer(state, ON_EXTENSIONS_CHANGED([]))
    expect(texts(state.selectedExtensions)).toEqual(['Låst'])
  })

  it('stops resolving and keeps the message when a cloud template fails', () => {
    const reducer = createReducer(setupData())
    let state = reducer(initialState, ON_CLOUD_TEMPLATE_RESOLVING())
    state = reducer(state, ON_CLOUD_TEMPLATE_ERROR('Kunne ikke laste ned'))
    expect(state.isResolvingCloudTemplate).toBe(false)
    expect(state.cloudTemplateError).toBe('Kunne ikke laste ned')
  })
})
