// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Fluent's combobox family cannot be opened under jsdom on React
// 17 (see the testing guide), so the choice, multi-choice and lookup fields get a native select
// that keeps Fluent's contract: a choice calls `onOptionSelect` with the option's value, text and
// the selected options. The taxonomy picker comes from `@pnp/spfx-controls-react`, which maps to
// the one PnP stub like every `@pnp/*` import; the stub is kept, and only the picker replaced by
// one that shows its terms and picks "Idrett".
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const Combobox = ({ placeholder, multiselect, onOptionSelect, children }: any) =>
    React.createElement(
      'select',
      {
        'aria-label': placeholder ?? 'Oppslag',
        multiple: !!multiselect,
        defaultValue: multiselect ? [] : '',
        onChange: (event: any) => {
          const selected = Array.from(event.target.options).filter((option: any) => option.selected)
          const [option] = selected as any[]
          onOptionSelect?.(event, {
            optionValue: option?.value,
            optionText: option?.textContent,
            selectedOptions: selected.map((o: any) => o.value)
          })
        }
      },
      multiselect ? null : React.createElement('option', { value: '' }),
      children
    )
  const Option = ({ value, children }: any) =>
    React.createElement('option', { value: value ?? children }, children)
  return { __esModule: true, ...actual, Combobox, Option }
})
jest.mock('@pnp/spfx-controls-react/lib/ModernTaxonomyPicker', () => {
  const stub = jest.requireActual('@pnp/spfx-controls-react/lib/ModernTaxonomyPicker')
  const React = jest.requireActual('react')
  const IDRETT = {
    id: 'term-9',
    labels: [{ name: 'Idrett', isDefault: true, languageTag: 'nb-NO' }]
  }
  const ModernTaxonomyPicker = ({ initialValues, onChange, panelTitle }: any) =>
    React.createElement(
      'div',
      { 'aria-label': panelTitle },
      (initialValues ?? []).map((term: any) =>
        React.createElement('span', { key: term.id }, term.labels[0].name)
      ),
      React.createElement('button', { onClick: () => onChange([IDRETT]) }, 'Velg Idrett')
    )
  return new Proxy(stub, {
    get: (target, prop) => (prop === 'ModernTaxonomyPicker' ? ModernTaxonomyPicker : target[prop])
  })
})

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import resource from 'SharedResources'
import { CustomEditPanel } from '.'
import { EditableSPField, ItemFieldValues } from '../../models'

const field = (InternalName: string, TypeAsString: string, extra: Record<string, any> = {}) =>
  new EditableSPField({ InternalName, Title: InternalName, TypeAsString, ...extra } as any)

const FIELDS = [
  field('Title', 'Text', { Title: 'Tittel', Required: true }),
  field('GtDescription', 'Note', { Title: 'Beskrivelse' }),
  field('GtIsProgram', 'Boolean', { Title: 'Program' }),
  field('GtBudget', 'Currency', { Title: 'Budsjett' }).init([
    {
      internalName: 'GtBudget',
      name: 'Budsjett',
      data: { dataTypeProperties: { min: 0, max: 1000000 } }
    }
  ] as any),
  field('GtProgress', 'Number', { Title: 'Fremdrift', ShowAsPercentage: true }),
  field('GtHomepage', 'URL', { Title: 'Hjemmeside' }),
  field('GtPhase', 'Choice', { Title: 'Fase', Choices: ['Konsept', 'Gjennomføring'] }),
  field('GtAreas', 'MultiChoice', { Title: 'Områder', Choices: ['Helse', 'Idrett', 'Kultur'] }),
  field('GtSecret', 'Text', { Title: 'Hemmelig' }),
  field('GtCalculated', 'Text', { Title: 'Beregnet', ShowInEditForm: false })
]

const VALUES = new ItemFieldValues({ Title: 'Frisbeegolfbane' }, { Title: 'Frisbeegolfbane' })

/** A target web: the items of a lookup list, and the taxonomy text field's internal name. */
function targetWeb(lookupItems: any[] = []) {
  return {
    lists: {
      getById: () => ({
        items: {
          select: () => ({
            top: () => ({
              async *[Symbol.asyncIterator]() {
                yield lookupItems
              }
            })
          })
        },
        fields: {
          getById: (id: string) => ({
            select: () => ({ using: () => () => Promise.resolve({ InternalName: `${id}Text` }) })
          })
        }
      })
    },
    ensureUser: () => Promise.resolve({ Id: 1 })
  }
}

const ADAPTER = {
  spfxContext: { pageContext: { cultureInfo: { currentUICultureName: 'nb-NO' } } }
} as any

function renderPanel(props: Record<string, any> = {}) {
  const onSubmit = jest.fn(() => Promise.resolve())
  const onClose = jest.fn()
  render(
    <CustomEditPanel
      open
      headerText='Rediger prosjektinformasjon'
      fields={FIELDS}
      fieldValues={VALUES}
      hiddenFields={['GtSecret']}
      targetWeb={targetWeb() as any}
      targetListId='list-1'
      dataAdapter={ADAPTER}
      submit={{ onSubmit, saveProgressText: 'Lagrer endringene' }}
      onClose={onClose}
      debug
      {...props}
    />
  )
  return { onSubmit, onClose }
}

/** What the save would send, as the debug view shows it. */
const properties = () => JSON.parse(document.querySelector('pre').textContent)
const save = () => screen.getByText(strings.SaveText).closest('button')
// A required field's label ends with an asterisk.
const input = (label: string) => screen.getByLabelText((content) => content.startsWith(label))
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
/** Runs a user action and lets the model's asynchronous writes finish. */
const run = (action: () => void) =>
  act(async () => {
    action()
    await settle()
  })
const type = (element: HTMLElement, value: string) =>
  act(async () => {
    fireEvent.change(element, { target: { value } })
    await settle()
  })

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('CustomEditPanel', () => {
  it('shows the fields that can be edited, and not the hidden ones', () => {
    renderPanel()
    for (const label of [
      'Tittel',
      'Beskrivelse',
      'Program',
      'Budsjett',
      'Fremdrift',
      'Hjemmeside'
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getByLabelText(strings.Placeholder.ChoiceField)).toBeInTheDocument()
    expect(screen.getByLabelText(strings.Placeholder.MultiChoiceField)).toBeInTheDocument()
    expect(screen.queryByText('Hemmelig')).toBeNull()
    expect(screen.queryByText('Beregnet')).toBeNull()
    expect(input('Tittel')).toHaveValue('Frisbeegolfbane')
  })

  it('keeps save off while a required field is empty', async () => {
    renderPanel()
    expect(save()).toBeEnabled()
    await type(input('Tittel'), '')
    expect(save()).toBeDisabled()
    expect(save()).toHaveAttribute('title', strings.Aria.SaveDisabledTitle)
  })

  it('saves the changes, showing its progress until they are saved', async () => {
    let finish: () => void
    const onSubmit = jest.fn((_model: any) => new Promise<void>((resolve) => (finish = resolve)))
    renderPanel({ submit: { onSubmit, saveProgressText: 'Lagrer endringene' } })
    await type(input('Beskrivelse'), 'Bane med 18 hull')
    fireEvent.click(save())
    expect(screen.getByText('Lagrer endringene')).toBeInTheDocument()
    expect(onSubmit.mock.calls[0][0].properties).toEqual({ GtDescription: 'Bane med 18 hull' })
    await act(async () => {
      finish()
      await settle()
    })
    expect(screen.queryByText('Lagrer endringene')).toBeNull()
    expect(save()).toBeInTheDocument()
  })

  it('shows the error of a failed save, and closes', () => {
    const { onClose } = renderPanel({
      submit: { onSubmit: jest.fn(), error: 'Kunne ikke lagre prosjektinformasjonen' }
    })
    expect(screen.getByText('Kunne ikke lagre prosjektinformasjonen')).toBeInTheDocument()
    fireEvent.click(screen.getByText(strings.CloseText))
    expect(onClose).toHaveBeenCalled()
  })

  it('refuses a web address without http:// or https://', async () => {
    renderPanel()
    const address = screen.getByPlaceholderText(strings.Placeholder.UrlField)
    await type(address, 'frisbee.no')
    expect(screen.getByText(strings.Validation.UrlFieldInvalidFormat)).toBeInTheDocument()
    expect(save()).toBeDisabled()
    await type(address, 'https://frisbee.no')
    expect(screen.queryByText(strings.Validation.UrlFieldInvalidFormat)).toBeNull()
    expect(save()).toBeEnabled()
    await type(screen.getByPlaceholderText(strings.Placeholder.UrlFieldAlternative), 'Banen')
    expect(properties().GtHomepage).toEqual({ Url: 'https://frisbee.no', Description: 'Banen' })
  })

  it('keeps an amount within the limits of its column', async () => {
    renderPanel()
    const budget = input('Budsjett')
    await type(budget, '2000000')
    expect(
      screen.getByText(
        strings.Validation.NumberFieldMinMax.replace('{0}', '0').replace('{1}', '1000000')
      )
    ).toBeInTheDocument()
    expect(save()).toBeDisabled()
    await type(budget, '500000')
    expect(save()).toBeEnabled()
    expect(properties().GtBudget).toBe('500000')
  })

  it('takes a percentage as a share of one, at most all of it', async () => {
    renderPanel()
    await type(input('Fremdrift'), '45')
    expect(properties().GtProgress).toBe(0.45)
    await type(input('Fremdrift'), '150')
    expect(properties().GtProgress).toBe(1)
  })

  it('takes a switch, a choice and several choices', async () => {
    renderPanel()
    await run(() => {
      fireEvent.click(input('Program'))
    })
    expect(properties().GtIsProgram).toBe(true)
    await run(() => {
      fireEvent.change(screen.getByLabelText(strings.Placeholder.ChoiceField), {
        target: { value: 'Gjennomføring' }
      })
    })
    expect(properties().GtPhase).toBe('Gjennomføring')
    const areas = screen.getByLabelText(strings.Placeholder.MultiChoiceField) as HTMLSelectElement
    areas.options[0].selected = true
    areas.options[2].selected = true
    await run(() => {
      fireEvent.change(areas)
    })
    expect(properties().GtAreas).toEqual(['Helse', 'Kultur'])
  })

  it('looks up the items of the lookup list, leaving out what the configuration does not allow', async () => {
    const lookup = field('GtTimelineTypeLookup', 'Lookup', {
      Title: 'Type',
      LookupList: 'list-types',
      LookupField: 'Title'
    })
    renderPanel({
      fields: [lookup],
      targetWeb: targetWeb([
        { Id: 1, Title: resource.TimelineConfiguration_Project_Title },
        { Id: 2, Title: 'Milepæl' },
        { Id: 3, Title: 'Leveranse' },
        { Id: 4, Title: resource.TimelineConfiguration_ProjectDelivery_Title }
      ]),
      allowedLookupValues: { GtTimelineTypeLookup: ['Milepæl', 'Leveranse'] }
    })
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        '',
        'Milepæl',
        'Leveranse'
      ])
    )
    await run(() => {
      fireEvent.change(screen.getByLabelText('Oppslag'), { target: { value: '3' } })
    })
    expect(properties().GtTimelineTypeLookupId).toBe('3')
  })

  it("shows a term field's terms, and sends the terms picked through its text field", async () => {
    const tags = field('GtTags', 'TaxonomyFieldTypeMulti', {
      Title: 'Stikkord',
      TextField: 'tags-text',
      TermSetId: 'set-1'
    })
    renderPanel({
      fields: [tags],
      fieldValues: new ItemFieldValues(
        { GtTags: [{ TermGuid: 'term-1', Label: 'Helse' }] },
        { GtTags: 'Helse' }
      )
    })
    expect(screen.getByText('Helse')).toBeInTheDocument()
    await run(() => {
      fireEvent.click(screen.getByText('Velg Idrett'))
    })
    await waitFor(() => expect(properties()['tags-textText']).toBe('-1;#Idrett|term-9'))
  })

  it('shows a date in the date picker', async () => {
    const start = field('GtStartDate', 'DateTime', { Title: 'Startdato' })
    renderPanel({
      fields: [start],
      fieldValues: new ItemFieldValues(
        { GtStartDate: '2026-03-01T00:00:00Z' },
        { GtStartDate: '01.03.2026' }
      )
    })
    const date = await screen.findByPlaceholderText(strings.Placeholder.DatePicker)
    expect(date).toHaveValue(new Date('2026-03-01T00:00:00Z').toLocaleDateString())
    // The label is tied to the date's input, not to an id nothing has.
    expect(screen.getByLabelText(/Startdato/)).toBe(date)
  })
})
