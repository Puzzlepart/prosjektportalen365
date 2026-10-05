import { act, render } from '@testing-library/react'
import * as React from 'react'
import { EditableSPField, ItemFieldValues } from '../../models'
import { useModel } from './useModel'

/**
 * The edit panel's model: what each field shows (the item's value until the user changes it), and
 * what the save sends for each field type. The target web is a structural stand-in for the PnPjs
 * calls the transforms make: the taxonomy text field's internal name, and `ensureUser`.
 */
const field = (InternalName: string, TypeAsString: string, extra: Record<string, any> = {}) =>
  new EditableSPField({ InternalName, Title: InternalName, TypeAsString, ...extra } as any)

const FIELD_VALUES = new ItemFieldValues(
  {
    Title: 'Frisbeegolfbane',
    GtHomepage: { Url: 'https://frisbee.no', Description: 'Hjemmeside' },
    GtAreas: 'Helse, Idrett',
    GtStartDate: '2026-03-01T00:00:00Z',
    GtProjectManager: { Id: 7, Title: 'Kari Nordmann', EMail: 'kari@contoso.no' }
  },
  {
    Title: 'Frisbeegolfbane',
    GtHomepage: 'https://frisbee.no, Hjemmeside',
    GtAreas: 'Helse, Idrett',
    GtStartDate: '01.03.2026',
    GtProjectManager: 'Kari Nordmann'
  }
)

function targetWeb() {
  const calls = { ensureUser: [] as string[], textFields: [] as string[] }
  const web = {
    lists: {
      getById: () => ({
        fields: {
          getById: (id: string) => ({
            select: () => ({
              using: () => () => {
                calls.textFields.push(id)
                return Promise.resolve({ InternalName: `${id}Text` })
              }
            })
          })
        }
      })
    },
    ensureUser: (email: string) => {
      calls.ensureUser.push(email)
      return email === 'ukjent@contoso.no'
        ? Promise.reject(new Error('Fant ikke brukeren'))
        : Promise.resolve({ Id: { 'kari@contoso.no': 12, 'ola@contoso.no': 13 }[email] })
    }
  }
  return { web, calls }
}

/** Runs the model for the item above; `current()` is the model after the latest render. */
function renderModel() {
  const { web, calls } = targetWeb()
  let model: ReturnType<typeof useModel>
  const Probe: React.FC = () => {
    model = useModel({
      fieldValues: FIELD_VALUES,
      targetWeb: web,
      targetListId: 'list-1',
      dataAdapter: {
        spfxContext: { pageContext: { cultureInfo: { currentUICultureName: 'nb-NO' } } }
      }
    } as any)
    return null
  }
  render(<Probe />)
  return { current: () => model, calls }
}

const set = (model: () => ReturnType<typeof useModel>, f: EditableSPField, value: any) =>
  act(() => model().set(f, value))

const TERM = (id: string, nb: string, en: string) => ({
  id,
  labels: [
    { name: en, languageTag: 'en-US', isDefault: true },
    { name: nb, languageTag: 'nb-NO', isDefault: false }
  ]
})

describe('useModel', () => {
  it("shows the item's values until the user changes them", async () => {
    const { current } = renderModel()
    const title = field('Title', 'Text')
    expect(current().get(title)).toBe('Frisbeegolfbane')
    expect(current().get(field('GtHomepage', 'URL'))).toEqual({
      url: 'https://frisbee.no',
      description: 'Hjemmeside'
    })
    expect(current().get(field('GtAreas', 'MultiChoice'))).toEqual(['Helse', 'Idrett'])
    expect(current().get(field('GtStartDate', 'DateTime'))).toEqual(
      new Date('2026-03-01T00:00:00Z')
    )
    expect(current().get(field('GtProjectManager', 'User'))).toEqual([
      expect.objectContaining({ key: 7, text: 'Kari Nordmann', secondaryText: 'kari@contoso.no' })
    ])
    expect(current().get(field('GtEmpty', 'Text'), 'ingen verdi')).toBe('ingen verdi')
    expect(current().isChanged).toBe(false)

    await set(current, title, 'Frisbeegolfbane i Grimstad')
    expect(current().get(title)).toBe('Frisbeegolfbane i Grimstad')
    expect(current().properties).toEqual({ Title: 'Frisbeegolfbane i Grimstad' })
    expect(current().isChanged).toBe(true)
  })

  it('sends a link as its URL and description', async () => {
    const { current } = renderModel()
    await set(current, field('GtHomepage', 'URL'), {
      url: 'https://frisbee.no/bane',
      description: 'Banen'
    })
    expect(current().properties).toEqual({
      GtHomepage: { Url: 'https://frisbee.no/bane', Description: 'Banen' }
    })
  })

  it('sends a person as the id SharePoint has for them, and no one as null', async () => {
    const { current, calls } = renderModel()
    const manager = field('GtProjectManager', 'User')
    await set(current, manager, [{ text: 'Kari Nordmann', secondaryText: 'kari@contoso.no' }])
    expect(calls.ensureUser).toEqual(['kari@contoso.no'])
    expect(current().properties).toEqual({ GtProjectManagerId: 12 })
    await set(current, manager, [])
    expect(current().properties).toEqual({ GtProjectManagerId: null })
  })

  it('sends several people as their ids', async () => {
    const { current } = renderModel()
    await set(current, field('GtMembers', 'UserMulti'), [
      { text: 'Kari Nordmann', secondaryText: 'kari@contoso.no' },
      { text: 'Ola Nordmann', secondaryText: 'ola@contoso.no' }
    ])
    expect(current().properties).toEqual({ GtMembersId: [12, 13] })
  })

  it('sends terms through the hidden text field, labelled in the language of the page', async () => {
    const { current, calls } = renderModel()
    await set(current, field('GtTags', 'TaxonomyFieldTypeMulti', { TextField: 'tags-text' }), [
      TERM('t1', 'Idrett', 'Sports'),
      TERM('t2', 'Helse', 'Health')
    ])
    expect(calls.textFields).toEqual(['tags-text'])
    expect(current().properties).toEqual({
      'tags-textText': '-1;#Idrett|t1;#-1;#Helse|t2'
    })
    await set(current, field('GtServiceArea', 'TaxonomyFieldType', { TextField: 'area-text' }), [
      TERM('t3', 'Kultur', 'Culture')
    ])
    expect(current().properties['area-textText']).toBe('-1;#Kultur|t3')
  })

  it('sends a lookup as the id of the item looked up', async () => {
    const { current } = renderModel()
    await set(current, field('GtPhaseLookup', 'Lookup'), 4)
    expect(current().properties).toEqual({ GtPhaseLookupId: 4 })
  })

  it('keeps the stored value when a person cannot be resolved', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const { current } = renderModel()
    const manager = field('GtProjectManager', 'User')
    await set(current, manager, [{ text: 'Ukjent', secondaryText: 'ukjent@contoso.no' }])
    expect(current().properties).toEqual({})
    expect(current().isChanged).toBe(false)
    expect(current().get(manager)[0].text).toBe('Kari Nordmann')
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('starts over on reset', async () => {
    const { current } = renderModel()
    const title = field('Title', 'Text')
    await set(current, title, 'Nytt navn')
    act(() => current().reset())
    expect(current().properties).toEqual({})
    expect(current().get(title)).toBe('Frisbeegolfbane')
  })
})
