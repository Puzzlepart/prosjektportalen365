import reducer, {
  COPY_DONE,
  COPY_PROGRESS,
  SELECTION_CHANGED,
  SET_SCREEN,
  SET_TARGET,
  START_COPY,
  initState
} from './reducer'
import { DocumentTemplateDialogScreen, IDocumentTemplateDialogState } from './types'

/**
 * The document template dialog's state: which screen the user is on (pick templates, pick a
 * folder, name the copies, watch the copy, read the summary), the templates picked, the folder
 * they go to, the copy's progress, and the files it uploaded. `locked` keeps the dialog from
 * being closed while files are being copied; `uploaded` is what the summary counts.
 */
type Template = IDocumentTemplateDialogState['selected'][number]
type UploadedFile = IDocumentTemplateDialogState['uploaded'][number]

const template = (id: string) => ({ id, name: `${id}.docx`, newName: `${id}.docx` }) as Template
const file = (Name: string) =>
  ({ Name, ServerRelativeUrl: `/sites/p/Delte dokumenter/${Name}` }) as UploadedFile

describe('DocumentTemplateDialog reducer', () => {
  it('starts on the select screen with nothing selected, no target folder and nothing uploaded', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      targetFolder: '',
      screen: DocumentTemplateDialogScreen.Select,
      selected: [],
      uploaded: []
    })
  })

  it('leaves the state as it is for an action it does not handle', () => {
    const state = initState()
    expect(reducer(state, { type: 'SOMETHING_ELSE' })).toBe(state)
  })

  it('replaces the selection with the templates the user ticked, and can clear it', () => {
    let state = reducer(
      { ...initState(), selected: [template('a')] },
      SELECTION_CHANGED({ selected: [template('b'), template('c')] })
    )
    expect(state.selected.map((t) => t.id)).toEqual(['b', 'c'])
    expect(state.screen).toBe(DocumentTemplateDialogScreen.Select)
    state = reducer(state, SELECTION_CHANGED({ selected: [] }))
    expect(state.selected).toEqual([])
  })

  it('keeps the selection when the user moves on to the folder and naming screens', () => {
    let state = reducer(
      { ...initState(), selected: [template('a')] },
      SET_SCREEN({ screen: DocumentTemplateDialogScreen.TargetFolder })
    )
    expect(state.screen).toBe(DocumentTemplateDialogScreen.TargetFolder)
    expect(state.selected.map((t) => t.id)).toEqual(['a'])
    state = reducer(state, SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy }))
    expect(state.screen).toBe(DocumentTemplateDialogScreen.EditCopy)
    expect(state.selected.map((t) => t.id)).toEqual(['a'])
  })

  it('going back to the select screen clears the selection, but keeps the folder and the last upload', () => {
    const state = reducer(
      {
        ...initState(),
        screen: DocumentTemplateDialogScreen.Summary,
        selected: [template('a')],
        targetFolder: '/sites/p/Delte dokumenter/Mal',
        uploaded: [file('a.docx')]
      },
      SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select })
    )
    expect(state.screen).toBe(DocumentTemplateDialogScreen.Select)
    expect(state.selected).toEqual([])
    expect(state.targetFolder).toBe('/sites/p/Delte dokumenter/Mal')
    expect(state.uploaded.map((f) => f.Name)).toEqual(['a.docx'])
  })

  it('remembers the folder the user picked without changing the screen', () => {
    const state = reducer(
      { ...initState(), screen: DocumentTemplateDialogScreen.EditCopy },
      SET_TARGET({ folder: '/sites/p/Delte dokumenter/Mal' })
    )
    expect(state.targetFolder).toBe('/sites/p/Delte dokumenter/Mal')
    expect(state.screen).toBe(DocumentTemplateDialogScreen.EditCopy)
  })

  it('starting the copy shows the progress screen and locks the dialog, keeping the selection and any earlier progress', () => {
    const progress = { description: 'gammel.docx', percentComplete: 0.5, iconOptions: {} }
    const state = reducer(
      {
        ...initState(),
        screen: DocumentTemplateDialogScreen.EditCopy,
        selected: [template('a')],
        progress
      },
      START_COPY()
    )
    expect(state.screen).toBe(DocumentTemplateDialogScreen.CopyProgress)
    expect(state.locked).toBe(true)
    expect(state.selected.map((t) => t.id)).toEqual(['a'])
    expect(state.progress).toEqual(progress)
  })

  it('each progress step replaces the previous one whole, on the same screen and still locked', () => {
    let state = reducer(initState(), START_COPY())
    state = reducer(
      state,
      COPY_PROGRESS({
        description: 'a.docx',
        percentComplete: 0,
        iconOptions: { extension: 'docx' }
      })
    )
    expect(state.progress).toEqual({
      description: 'a.docx',
      percentComplete: 0,
      iconOptions: { extension: 'docx' }
    })
    state = reducer(state, COPY_PROGRESS({ description: 'b.xlsx', percentComplete: 0.5 }))
    expect(state.progress).toEqual({ description: 'b.xlsx', percentComplete: 0.5 })
    expect(state.screen).toBe(DocumentTemplateDialogScreen.CopyProgress)
    expect(state.locked).toBe(true)
  })

  it('finishing the copy shows the summary of this copy, unlocks the dialog and clears the selection', () => {
    const progress = { description: 'b.docx', percentComplete: 0.5, iconOptions: {} }
    const state = reducer(
      {
        ...initState(),
        screen: DocumentTemplateDialogScreen.CopyProgress,
        locked: true,
        selected: [template('a'), template('b')],
        targetFolder: '/sites/p/Delte dokumenter',
        uploaded: [file('forrige.docx')],
        progress
      },
      COPY_DONE({ files: [file('a.docx'), file('b.docx')] })
    )
    expect(state.screen).toBe(DocumentTemplateDialogScreen.Summary)
    expect(state.locked).toBe(false)
    expect(state.selected).toEqual([])
    expect(state.uploaded.map((f) => f.Name)).toEqual(['a.docx', 'b.docx'])
    expect(state.targetFolder).toBe('/sites/p/Delte dokumenter')
    expect(state.progress).toEqual(progress)
  })
})
