import strings from 'ProjectExtensionsStrings'
import reducer, {
  BROWSE_FOLDER,
  COPY_DONE,
  COPY_PROGRESS,
  OPEN_LIBRARY,
  SELECTION_CHANGED,
  SELECT_FOLDER,
  SET_SCREEN,
  SET_TARGET,
  SHOW_LIBRARIES,
  START_COPY,
  TEMPLATE_CHANGED,
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
type Library = IDocumentTemplateDialogState['browse']['library']

/**
 * A template as the reducer reads it, with the model's `update`, which takes the values given and
 * leaves a field alone for an empty one.
 */
const template = (id: string, overrides: Partial<Template> = {}) =>
  ({
    id,
    name: `${id}.docx`,
    newName: `${id}.docx`,
    isFolder: false,
    update(properties: Record<string, string>) {
      Object.keys(properties).forEach((key) => {
        if (properties[key]) this[key] = properties[key]
      })
    },
    ...overrides
  }) as unknown as Template
const library = (name: string) => ({ name, url: `/sites/p/${name}`, folders: [] }) as Library
const file = (Name: string) =>
  ({ Name, ServerRelativeUrl: `/sites/p/Delte dokumenter/${Name}` }) as UploadedFile

describe('DocumentTemplateDialog reducer', () => {
  it('starts on the select screen with nothing selected, no target folder and nothing uploaded', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      targetFolder: '',
      screen: DocumentTemplateDialogScreen.Select,
      selected: [],
      uploaded: [],
      browse: { library: undefined, folder: '', libraries: false }
    })
  })

  it('starts browsing in the library the command was run in, at the folder it was run in', () => {
    const documents = library('Delte dokumenter')
    expect(
      initState({ currentLibrary: documents, currentFolderUrl: '/sites/p/Delte dokumenter/Mal' })
        .browse
    ).toEqual({ library: documents, folder: '/sites/p/Delte dokumenter/Mal', libraries: false })
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

describe('browsing for the target folder', () => {
  const documents = library('Delte dokumenter')
  const start = () =>
    reducer(initState({ currentLibrary: documents, currentFolderUrl: '' }), { type: '@@INIT' })

  it('opens a folder, which clears a folder picked by its row before', () => {
    let state = reducer(start(), SELECT_FOLDER({ folder: '/sites/p/Delte dokumenter/Mal' }))
    expect(state.browse.selectedFolder).toBe('/sites/p/Delte dokumenter/Mal')
    state = reducer(state, BROWSE_FOLDER({ folder: '/sites/p/Delte dokumenter/Rapporter' }))
    expect(state.browse).toEqual({
      library: documents,
      folder: '/sites/p/Delte dokumenter/Rapporter',
      libraries: false,
      selectedFolder: undefined
    })
    state = reducer(state, BROWSE_FOLDER({ folder: '' }))
    expect(state.browse.folder).toBe('')
  })

  it('lists the libraries, and opens one at its root', () => {
    const pictures = library('Bilder')
    let state = reducer(start(), SHOW_LIBRARIES())
    expect(state.browse.libraries).toBe(true)
    expect(state.browse.library).toEqual(documents)
    state = reducer(state, OPEN_LIBRARY({ library: pictures }))
    expect(state.browse).toEqual({
      library: pictures,
      folder: '/sites/p/Bilder',
      libraries: false,
      selectedFolder: undefined
    })
  })

  it('picks a folder by its row, and clears the pick', () => {
    let state = reducer(start(), SELECT_FOLDER({ folder: '/sites/p/Delte dokumenter/Mal' }))
    expect(state.browse.selectedFolder).toBe('/sites/p/Delte dokumenter/Mal')
    expect(state.browse.folder).toBe('')
    state = reducer(state, SELECT_FOLDER({ folder: undefined }))
    expect(state.browse.selectedFolder).toBeUndefined()
  })
})

describe('naming the copies', () => {
  const start = (...selected: Template[]) => ({ ...initState(), selected })

  it('renames a copy, passes on what SharePoint said about the name, and gives React a new list', () => {
    const before = start(template('a'), template('b'))
    const state = reducer(
      before,
      TEMPLATE_CHANGED({ id: 'a', properties: { newName: 'Plan.docx' }, errorMessage: 'Ugyldig' })
    )
    expect(state.selected.map((t) => t.newName)).toEqual(['Plan.docx', 'b.docx'])
    expect(state.selected[0].errorMessage).toBe('Ugyldig')
    expect(state.selected).not.toBe(before.selected)
  })

  it('takes a title, or the validation of an untouched name, without touching the rest', () => {
    let state = reducer(
      start(template('a', { errorMessage: 'Ugyldig' } as Partial<Template>)),
      TEMPLATE_CHANGED({ id: 'a', properties: { newTitle: 'Plan' } })
    )
    expect(state.selected[0].newTitle).toBe('Plan')
    expect(state.selected[0].errorMessage).toBe('Ugyldig')
    state = reducer(state, TEMPLATE_CHANGED({ id: 'a', properties: {}, errorMessage: undefined }))
    expect(state.selected[0].errorMessage).toBe('Ugyldig')
    state = reducer(state, TEMPLATE_CHANGED({ id: 'a', properties: {}, errorMessage: 'Opptatt' }))
    expect(state.selected[0].errorMessage).toBe('Opptatt')
  })

  it('flags both copies given the same name, worded for a file or a folder', () => {
    const state = reducer(
      start(template('a'), template('b')),
      TEMPLATE_CHANGED({ id: 'b', properties: { newName: 'A.DOCX' } })
    )
    expect(state.selected.map((t) => t.errorMessage)).toEqual([
      strings.FilenameAlreadySelectedErrorText,
      strings.FilenameAlreadySelectedErrorText
    ])
    const folders = reducer(
      start(
        template('x', { name: 'x', newName: 'x', isFolder: true } as Partial<Template>),
        template('y', { name: 'y', newName: 'y', isFolder: true } as Partial<Template>)
      ),
      TEMPLATE_CHANGED({ id: 'y', properties: { newName: 'x' } })
    )
    expect(folders.selected[1].errorMessage).toBe(strings.FolderNameAlreadySelectedErrorText)
  })

  it('clears the duplicate flags once the names differ again, but not an error SharePoint gave', () => {
    let state = reducer(
      start(
        template('a'),
        template('b'),
        template('c', { errorMessage: 'Opptatt' } as Partial<Template>)
      ),
      TEMPLATE_CHANGED({ id: 'b', properties: { newName: 'a.docx' } })
    )
    state = reducer(state, TEMPLATE_CHANGED({ id: 'b', properties: { newName: 'bb.docx' } }))
    expect(state.selected.map((t) => t.errorMessage)).toEqual([undefined, undefined, 'Opptatt'])
  })

  it('leaves the state as it is for a copy it does not hold', () => {
    const before = start(template('a'))
    expect(reducer(before, TEMPLATE_CHANGED({ id: 'zzz', properties: { newName: 'x' } }))).toBe(
      before
    )
  })
})
