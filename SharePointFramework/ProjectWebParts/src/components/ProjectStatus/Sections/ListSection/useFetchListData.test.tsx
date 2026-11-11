// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only lets `spfi()` hand out the test's web.
const mockWeb: { current: any } = { current: undefined }
jest.mock('@pnp/sp', () => {
  const stub = jest.requireActual('@pnp/sp')
  return new Proxy(stub, {
    get: (target, prop) =>
      prop === 'spfi' ? () => ({ using: () => ({ web: mockWeb.current }) }) : target[prop]
  })
})

import { render } from '@testing-library/react'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { ProjectStatusContext } from '../../context'
import { SectionContext } from '../context'
import { getSectionDataErrorMessage } from './sectionDataError'
import { useFetchListData } from './useFetchListData'

/**
 * A web whose lists fail to give their items with `error`, as SharePoint does for a list that is
 * not on the site (404); `lists` holds the titles asked for.
 */
function failingWeb(error: any) {
  const lists: string[] = []
  mockWeb.current = {
    lists: {
      getByTitle: (title: string) => {
        lists.push(title)
        return {
          getItemsByCAMLQuery: () => Promise.reject(error),
          fields: { select: () => () => Promise.resolve([]) }
        }
      }
    }
  }
  return lists
}

/** The section's fetch for the report series `DP1` («Delprosjekt 1»). */
function fetchFor(listTitle: string) {
  let fetchListData: ReturnType<typeof useFetchListData>
  const Probe: React.FC = () => {
    fetchListData = useFetchListData()
    return null
  }
  render(
    <ProjectStatusContext.Provider
      value={
        {
          state: { selectedScope: 'DP1' },
          props: {
            webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/alfa',
            sp: { web: {} },
            subProjects: 'DP1|Delprosjekt 1'
          }
        } as any
      }
    >
      <SectionContext.Provider
        value={{ section: { listTitle, viewQuery: '', viewFields: [], rowLimit: 10 } as any }}
      >
        <Probe />
      </SectionContext.Provider>
    </ProjectStatusContext.Provider>
  )
  return fetchListData().catch((error) => error)
}

describe('useFetchListData', () => {
  it("names the report series' list when it does not exist on the site", async () => {
    const lists = failingWeb(Object.assign(new Error('List does not exist'), { status: 404 }))
    const error = await fetchFor('Usikkerhet {scope}')
    expect(lists).toEqual(['Usikkerhet DP1'])
    expect(error).toMatchObject({ listTitle: 'Usikkerhet DP1', listNotFound: true })
    expect(getSectionDataErrorMessage(error)).toBe(
      format(strings.ListSectionListNotFoundMessage, 'Usikkerhet DP1')
    )
  })

  it('asks whether the section is configured correctly on any other error', async () => {
    failingWeb(Object.assign(new Error('Ugyldig CAML-spørring'), { status: 400 }))
    const error = await fetchFor('Prosjektleveranser {scope}')
    expect(error).toMatchObject({ listTitle: 'Prosjektleveranser DP1', listNotFound: false })
    expect(getSectionDataErrorMessage(error)).toBe(strings.ListSectionDataErrorMessage)
  })
})
