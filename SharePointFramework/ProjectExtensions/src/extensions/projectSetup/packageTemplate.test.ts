import {
  getImportedPackageTemplate,
  layerPackageTemplate,
  mergeTemplateParameters
} from './packageTemplate'

/** Standardmal's parameters, with the Maloppsett row's content type. */
const STANDARD_PARAMETERS = {
  ProvisionSiteFields: 'Kolonner for Prosjektportalen (Prosjekt)',
  ProjectContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
  TermSetIds: { GtProjectPhase: 'abcfc9d9-a263-4abb-8234-be973c46258a' }
}

/** Standardmal, as `ProjectTemplate.getSchema` reads it (a stand-in, not a whole `Schema`). */
const standard = (): any => ({
  Version: '1.15.0',
  Parameters: { ...STANDARD_PARAMETERS },
  ContentTypes: [{ ID: '0x0100486B1F8AEA24486FBA1C1BA9146C360C', Name: 'Sjekkpunkt' }],
  Lists: [{ Title: 'Fasesjekkliste' }]
})

describe('mergeTemplateParameters', () => {
  it("lets the package's parameters win, and merges the term sets key by key", () => {
    expect(
      mergeTemplateParameters(STANDARD_PARAMETERS, {
        ProjectContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01',
        TermSetIds: { GtTestChoice: '9b4b1c1d-0000-4000-8000-000000000001' }
      })
    ).toEqual({
      ProvisionSiteFields: 'Kolonner for Prosjektportalen (Prosjekt)',
      ProjectContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01',
      TermSetIds: {
        GtProjectPhase: 'abcfc9d9-a263-4abb-8234-be973c46258a',
        GtTestChoice: '9b4b1c1d-0000-4000-8000-000000000001'
      }
    })
  })

  it('keeps the base parameters when the package has none', () => {
    expect(mergeTemplateParameters(STANDARD_PARAMETERS, undefined)).toEqual(STANDARD_PARAMETERS)
  })
})

describe('layerPackageTemplate', () => {
  it('applies the base alone when there is no package template', () => {
    const base = standard()
    expect(layerPackageTemplate(base, undefined)).toEqual({ templateSchema: base })
  })

  it("lays the package's own template on top of the base, both with the merged parameters", () => {
    const pkg: any = {
      Version: '1.0',
      Parameters: { ProjectContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01' },
      Lists: [{ Title: 'Usikkerhet' }],
      ClientSidePages: [{ Name: 'Hjem.aspx' }]
    }
    const { templateSchema, packageTemplateSchema } = layerPackageTemplate(standard(), pkg)
    const Parameters = {
      ...STANDARD_PARAMETERS,
      ProjectContentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C01'
    }
    // The base keeps its content types and lists, which the package's lists bind.
    expect(templateSchema).toEqual({ ...standard(), Parameters })
    expect(packageTemplateSchema).toEqual({ ...pkg, Parameters })
  })

  it('applies nothing more for an empty package template, but takes its parameters', () => {
    const { templateSchema, packageTemplateSchema } = layerPackageTemplate(standard(), {
      Version: '1.0',
      Parameters: { CustomSiteFields: 'Egendefinerte kolonner for Prosjektportalen' }
    })
    expect(packageTemplateSchema).toBeUndefined()
    expect(templateSchema.Parameters.CustomSiteFields).toBe(
      'Egendefinerte kolonner for Prosjektportalen'
    )
    expect(layerPackageTemplate(standard(), { Version: '1.0' }).packageTemplateSchema).toBe(
      undefined
    )
  })
})

describe('getImportedPackageTemplate', () => {
  const LIBRARY = '/sites/pp/Malbibliotek'

  /** The hub's web, with the files at their server-relative URLs; others fail with `missing`. */
  const hubWeb = (files: Record<string, any>, missing: any = { status: 404 }) => {
    const getByTitle = jest.fn(() => ({
      rootFolder: { select: () => () => Promise.resolve({ ServerRelativeUrl: LIBRARY }) }
    }))
    const getFileByServerRelativePath = jest.fn((url: string) => ({
      getJSON: () => (url in files ? Promise.resolve(files[url]) : Promise.reject(missing))
    }))
    return { lists: { getByTitle }, getFileByServerRelativePath } as any
  }

  it("reads the package's template where the catalog stored it on import", async () => {
    const template = { Lists: [{ Title: 'Testprosjektliste' }] }
    const web = hubWeb({ [`${LIBRARY}/pp-packages/pp-testprosjekt/template.json`]: template })
    expect(await getImportedPackageTemplate(web, 'Malbibliotek', 'pp-testprosjekt')).toBe(template)
    expect(web.lists.getByTitle).toHaveBeenCalledWith('Malbibliotek')
  })

  it('returns nothing for a package that has no template there', async () => {
    expect(
      await getImportedPackageTemplate(hubWeb({}), 'Malbibliotek', 'pp-forside-hurtiglenke')
    ).toBeUndefined()
  })

  it('fails with any other error, so the setup does not go on without the template', async () => {
    const denied = { status: 403 }
    await expect(
      getImportedPackageTemplate(hubWeb({}, denied), 'Malbibliotek', 'pp-testprosjekt')
    ).rejects.toBe(denied)
  })
})
