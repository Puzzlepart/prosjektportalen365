// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter is `adapter`; the document template dialog
// (tested on its own) records the context and props it was opened with, and closes on a click.
;(globalThis as any).DEBUG = false
const HUB = 'https://contoso.sharepoint.com/sites/pp365'
const adapter = {
  configure: jest.fn(() => Promise.resolve()),
  portalDataService: { url: HUB, isAvailable: true },
  getDocumentTemplates: jest.fn(() => Promise.resolve([{ name: 'Prosjektplan.docx' }])),
  getLibraries: jest.fn(() =>
    Promise.resolve([
      { id: 'lib-2', title: 'Dokumenter' },
      { id: 'lib-1', title: 'Prosjektdokumenter' }
    ])
  )
}
jest.mock('data', () => ({ SPDataAdapter: adapter }))
const opened: { context?: any; props?: any } = {}
jest.mock('components', () => {
  const React = jest.requireActual('react')
  const { TemplateSelectorContext } = jest.requireActual('./context')
  return {
    DocumentTemplateDialog: (props: any) => {
      opened.context = React.useContext(TemplateSelectorContext)
      opened.props = props
      return React.createElement(
        'button',
        { onClick: () => props.onDismiss({ reload: false }) },
        props.title
      )
    }
  }
})

import { act, fireEvent, screen } from '@testing-library/react'
import strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'
import TemplateSelectorCommand from '.'

const OPEN = 'OPEN_TEMPLATE_SELECTOR'

/** The command set in the library with id `lib-1`, initialised. */
async function selectorCommand(properties: Record<string, any> = {}) {
  const command = new TemplateSelectorCommand()
  ;(command as any).context = {
    manifest: { version: '1.15.0' },
    pageContext: {
      site: { id: { toString: () => 'site-1' } },
      web: { absoluteUrl: 'https://contoso.sharepoint.com/sites/frisbee' },
      list: { id: { toString: () => 'lib-1' } }
    }
  }
  ;(command as any).properties = properties
  const raiseOnChange = jest.spyOn(command, 'raiseOnChange')
  await command.onInit()
  return { command, raiseOnChange, open: command.tryGetCommand(OPEN) }
}

const execute = (command: TemplateSelectorCommand) =>
  act(() => command.onExecute({ itemId: OPEN } as any))

beforeEach(() => {
  adapter.configure.mockImplementation(() => Promise.resolve())
  adapter.configure.mockClear()
  adapter.getDocumentTemplates.mockClear()
  adapter.portalDataService.isAvailable = true
  opened.context = undefined
  window.history.replaceState({}, '', '/sites/frisbee/Delte%20dokumenter/Forms/AllItems.aspx')
})

afterEach(() => {
  // The dialog is rendered into a placeholder of its own on the page; the tests close what they
  // open, and the empty placeholders go here.
  document.body.querySelectorAll(':scope > div').forEach((placeholder) => placeholder.remove())
})

describe('TemplateSelectorCommand', () => {
  it('names its command and shows it in the library', async () => {
    const { command, open } = await selectorCommand()
    expect(open.title).toBe(strings.TemplateSelectorCommandTitle)
    expect(open.iconImageUrl).toMatch(/^data:image\/svg\+xml,/)
    command.onListViewUpdated()
    expect(open.visible).toBe(true)
  })

  it('opens the template dialog with the templates, the libraries and the current folder', async () => {
    window.history.replaceState(
      {},
      '',
      '/sites/frisbee/Delte%20dokumenter/Forms/AllItems.aspx?id=%2Fsites%2Ffrisbee%2FDelte%20dokumenter%2FMøter'
    )
    const { command } = await selectorCommand()
    await execute(command)
    expect(adapter.getDocumentTemplates).toHaveBeenCalledWith(
      resource.Lists_TemplateLibrary_Title,
      '<View Scope="RecursiveAll"></View>'
    )
    expect(opened.props.title).toBe(strings.TemplateLibrarySelectModalTitle)
    expect(opened.context).toMatchObject({
      templates: [{ name: 'Prosjektplan.docx' }],
      currentLibrary: { id: 'lib-1', title: 'Prosjektdokumenter' },
      currentFolderUrl: '/sites/frisbee/Delte dokumenter/Møter',
      templateLibrary: {
        title: resource.Lists_TemplateLibrary_Title,
        url: `${HUB}/${resource.Lists_TemplateLibrary_Title}`
      }
    })
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
    expect(screen.queryByText(strings.TemplateLibrarySelectModalTitle)).toBeNull()
  })

  it('uses the template library of its properties, and the first library outside a known one', async () => {
    const { command } = await selectorCommand({ templateLibrary: 'Maler for bygg' })
    ;(command as any).context.pageContext.list.id = { toString: () => 'lib-9' }
    await execute(command)
    expect(opened.context.templateLibrary).toEqual({
      title: 'Maler for bygg',
      url: `${HUB}/Maler for bygg`
    })
    expect(opened.context.currentLibrary).toEqual({ id: 'lib-2', title: 'Dokumenter' })
    expect(opened.context.currentFolderUrl).toBeUndefined()
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })

  it('loads the templates once', async () => {
    const { command } = await selectorCommand()
    await execute(command)
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
    await execute(command)
    expect(adapter.configure).toHaveBeenCalledTimes(1)
    expect(adapter.getDocumentTemplates).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })

  it('says it is not available, and opens nothing, when the hub is out of reach', async () => {
    adapter.portalDataService.isAvailable = false
    const { command, raiseOnChange, open } = await selectorCommand()
    await execute(command)
    expect(opened.context).toBeUndefined()
    expect(raiseOnChange).toHaveBeenCalled()
    command.onListViewUpdated()
    expect(open.title).toBe(strings.TemplateSelectorCommandDisabledTitle)
  })

  it('tries again after a failed load', async () => {
    adapter.configure.mockImplementationOnce(() => Promise.reject(new Error('503')))
    const { command, open } = await selectorCommand()
    await execute(command)
    expect(opened.context).toBeUndefined()
    command.onListViewUpdated()
    expect(open.title).toBe(strings.TemplateSelectorCommandDisabledTitle)
    await execute(command)
    expect(opened.context.templates).toEqual([{ name: 'Prosjektplan.docx' }])
    fireEvent.click(screen.getByText(strings.TemplateLibrarySelectModalTitle))
  })
})
