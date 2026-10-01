import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { EditableSPField } from '../../../../models'
import { CustomEditPanelContext, ICustomEditPanelContext } from '../../context'
import { User } from './User'
import { UserMulti } from './UserMulti'

/**
 * The contract of the two person fields in `CustomEditPanel`, asserted through labels, text and the
 * combobox/option roles rather than anything Fluent-specific. Both fields now render the shared
 * `PeoplePicker`, which is still the v8 `NormalPeoplePicker` inside (see Decision B); these tests
 * were written against the previous inline pickers and passed unchanged afterwards, so they are
 * what will show whether a future v9 picker keeps the same behaviour.
 *
 * The people themselves are the plain objects `clientPeoplePickerSearchUser` returns — `text` is the
 * display name and `secondaryText` the email, which is the identity the save path resolves through
 * `ensureUser`. That shape, not a Fluent type, is what these fields exchange with the model.
 */

const KARI = {
  key: 1,
  id: 'i:0#.f|membership|kari@contoso.no',
  text: 'Kari Nordmann',
  secondaryText: 'kari@contoso.no',
  imageUrl: '/_layouts/15/userphoto.aspx?AccountName=kari@contoso.no&size=L'
}

const OLA = {
  key: 2,
  id: 'i:0#.f|membership|ola@contoso.no',
  text: 'Ola Nordmann',
  secondaryText: 'ola@contoso.no',
  imageUrl: '/_layouts/15/userphoto.aspx?AccountName=ola@contoso.no&size=L'
}

/**
 * A field carrying only what the person fields read off it.
 */
function createField(): EditableSPField {
  return {
    internalName: 'GtProjectManager',
    displayName: 'Prosjektleder',
    description: 'Hvem som leder prosjektet',
    required: false
  } as EditableSPField
}

/**
 * Renders a person field inside a context whose model holds `selected` and records every `set`.
 * The resolver mirrors the real adapter: it matches on display name and drops anyone already
 * selected.
 */
function renderField(
  Component: typeof User | typeof UserMulti,
  { selected = [], suggestions = [KARI, OLA] } = {}
) {
  const set = jest.fn()
  const clientPeoplePickerSearchUser = jest.fn((filter: string, selectedItems: any[]) =>
    Promise.resolve(
      suggestions
        .filter((s) => s.text.toLowerCase().includes(filter.toLowerCase()))
        .filter((s) => !selectedItems?.some((i) => i.secondaryText === s.secondaryText))
    )
  )
  const context = {
    model: { get: () => selected, set },
    props: { dataAdapter: { clientPeoplePickerSearchUser } }
  } as unknown as ICustomEditPanelContext

  const result = render(
    <CustomEditPanelContext.Provider value={context}>
      <Component field={createField()} />
    </CustomEditPanelContext.Provider>
  )
  return { ...result, set, clientPeoplePickerSearchUser }
}

/**
 * `pointerEventsCheck` is off because Fluent's popup surfaces compute to
 * `pointer-events: none` under jsdom, which has no layout: the guard would reject a click the
 * browser performs happily. The click itself is still a real click.
 */
function setupUser() {
  return userEvent.setup({ pointerEventsCheck: 0 })
}

/**
 * Types a query into the field's text input, which is the only combobox it renders.
 */
async function search(user: ReturnType<typeof userEvent.setup>, query: string) {
  const input = screen.getByRole('combobox')
  await user.click(input)
  await user.type(input, query)
  return input
}

/**
 * Picks a suggestion by the name shown on it.
 */
async function pick(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(await screen.findByRole('option', { name }))
}

/**
 * The value handed to the model by the last `set`, as a list of emails.
 */
function storedEmails(set: jest.Mock): string[] {
  const stored = set.mock.calls[set.mock.calls.length - 1][1]
  return stored.map((person: any) => person.secondaryText)
}

describe.each([
  ['User', User],
  ['UserMulti', UserMulti]
])('%s', (_name, Component) => {
  it('renders the field label and description', () => {
    renderField(Component)
    // The label appears more than once: besides the visible one, the picker names its input and
    // its selected-items list with it, which is what gives the input an accessible name.
    expect(screen.getAllByText('Prosjektleder').length).toBeGreaterThan(0)
    expect(screen.getByText('Hvem som leder prosjektet')).toBeInTheDocument()
  })

  it('gives its input an accessible name', () => {
    renderField(Component)
    expect(screen.getByRole('combobox', { name: 'Prosjektleder' })).toBeInTheDocument()
  })

  it('shows the people already selected', () => {
    renderField(Component, { selected: [KARI] })
    expect(screen.getAllByText('Kari Nordmann').length).toBeGreaterThan(0)
  })

  it('offers people matching what is typed', async () => {
    const user = setupUser()
    const { clientPeoplePickerSearchUser } = renderField(Component)
    await search(user, 'Kari')
    await waitFor(() => expect(clientPeoplePickerSearchUser).toHaveBeenCalled())
    expect(await screen.findByRole('option', { name: /Kari Nordmann/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Ola Nordmann/ })).toBeNull()
  })

  it('stores the person picked, identified by email', async () => {
    const user = setupUser()
    const { set } = renderField(Component)
    await search(user, 'Kari')
    await pick(user, /Kari Nordmann/)
    await waitFor(() => expect(set).toHaveBeenCalled())
    expect(storedEmails(set)).toEqual(['kari@contoso.no'])
  })
})

describe('User', () => {
  it('offers no further input once a person is selected, the field holding only one', () => {
    renderField(User, { selected: [KARI] })
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})

describe('UserMulti', () => {
  it('keeps the people already selected when another is added', async () => {
    const user = setupUser()
    const { set } = renderField(UserMulti, { selected: [KARI] })
    await search(user, 'Ola')
    await pick(user, /Ola Nordmann/)
    await waitFor(() => expect(set).toHaveBeenCalled())
    expect(storedEmails(set)).toEqual(['kari@contoso.no', 'ola@contoso.no'])
  })

  it('tells the resolver who is already selected, so they are not offered twice', async () => {
    const user = setupUser()
    const { clientPeoplePickerSearchUser } = renderField(UserMulti, { selected: [KARI] })
    await search(user, 'Nordmann')
    await waitFor(() => expect(clientPeoplePickerSearchUser).toHaveBeenCalled())
    const [, selectedItems] = clientPeoplePickerSearchUser.mock.calls[0]
    expect(selectedItems).toEqual(expect.arrayContaining([expect.objectContaining(KARI)]))
    expect(screen.queryByRole('option', { name: /Kari Nordmann/ })).toBeNull()
  })
})
