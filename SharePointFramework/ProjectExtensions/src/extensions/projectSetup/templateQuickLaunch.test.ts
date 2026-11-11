import resource from 'SharedResources'
import type { NavigationNodes } from './tasks'
import { TemplateQuickLaunch, normaliseMenuUrl } from './templateQuickLaunch'

const BASE = {
  webUrl: 'https://contoso.sharepoint.com/sites/pp/frisbee',
  siteUrl: 'https://contoso.sharepoint.com/sites/pp'
}

describe('normaliseMenuUrl', () => {
  it.each([
    ['a web-relative URL', 'Lists/Prosjektlogg/AllItems.aspx'],
    ['a server-relative URL', '/sites/pp/frisbee/Lists/Prosjektlogg/AllItems.aspx'],
    [
      'an absolute URL on the web',
      'https://contoso.sharepoint.com/sites/pp/frisbee/Lists/Prosjektlogg/AllItems.aspx'
    ],
    ['another case', '/SITES/pp/Frisbee/lists/prosjektlogg/allitems.aspx'],
    ['a URL with {site}', '{site}/frisbee/Lists/Prosjektlogg/AllItems.aspx'],
    ['a URL with {sitecollection}', '{sitecollection}/frisbee/Lists/Prosjektlogg/AllItems.aspx'],
    ['a URL with {hosturl}', '{hosturl}/sites/pp/frisbee/Lists/Prosjektlogg/AllItems.aspx']
  ])('resolves %s to the server-relative path in lower case', (_, url) => {
    expect(normaliseMenuUrl(url, BASE)).toBe('/sites/pp/frisbee/lists/prosjektlogg/allitems.aspx')
  })

  it('decodes the path, drops a trailing slash and keeps a query string as it is', () => {
    expect(normaliseMenuUrl('/sites/pp/frisbee/Delte%20dokumenter/', BASE)).toBe(
      '/sites/pp/frisbee/delte dokumenter'
    )
    expect(normaliseMenuUrl('SitePages/Hjem.aspx?Mode=Edit', BASE)).toBe(
      '/sites/pp/frisbee/sitepages/hjem.aspx?Mode=Edit'
    )
    expect(normaliseMenuUrl('/sites/pp/frisbee/100%', BASE)).toBe('/sites/pp/frisbee/100%')
  })

  it('keeps a URL on another host as it is', () => {
    expect(normaliseMenuUrl('https://kart.contoso.no/Frisbee/', BASE)).toBe(
      'https://kart.contoso.no/Frisbee/'
    )
    expect(normaliseMenuUrl('mailto:pmo@contoso.no', BASE)).toBe('mailto:pmo@contoso.no')
  })

  it.each([[''], [undefined], ['#'], ['#anker'], ['http://linkless.header/']])(
    'names no page for %p',
    (url) => {
      expect(normaliseMenuUrl(url, BASE)).toBeUndefined()
    }
  )
})

describe('TemplateQuickLaunch', () => {
  const declared = TemplateQuickLaunch.of(
    [
      [
        { Title: 'Hjem', Url: 'SitePages/ProjectHome.aspx' },
        { Title: 'Notatblokk', Url: '#' },
        {
          Title: 'Nytteoversikt',
          Url: 'SitePages/Nytteoversikt.aspx',
          Children: [{ Title: 'Nytteoppfølging', Url: 'Lists/Nytteoppflging/AllItems.aspx' }]
        }
      ],
      [{ Title: 'Prosjektstatus', Url: 'SitePages/Prosjektstatus.aspx' }]
    ],
    BASE
  )

  it('declares a title of its level, from any schema', () => {
    expect(declared.declares('Hjem', 'https://kart.contoso.no')).toBeDefined()
    expect(declared.declares('Prosjektstatus', '')).toBeDefined()
    expect(declared.declares('Nytteoppfølging', '')).toBeUndefined()
    expect(declared.childrenOf('Nytteoversikt').declares('Nytteoppfølging', '')).toBeDefined()
  })

  it('declares a URL of any level, but not one that names no page', () => {
    expect(
      declared.declares('Oppfølging', '/sites/pp/frisbee/Lists/Nytteoppflging/AllItems.aspx')
    ).toBe('its URL is declared')
    expect(declared.declares('Overskrift', '#')).toBeUndefined()
    expect(declared.declares('Banekart', 'https://kart.contoso.no/frisbee')).toBeUndefined()
  })

  it('declares an earlier title of a node only where the level declares the title that replaced it', () => {
    expect(
      declared.declares('Gevinstoversikt', '/sites/pp/frisbee/SitePages/Gevinstoversikt.aspx')
    ).toBe(
      `it is the template's '${resource.Navigation_BenefitsOverview_Title}' under an earlier title`
    )
    expect(declared.declares('Gevinstarbeid', '')).toBeDefined()
    expect(declared.declares('Notatbok', '')).toBeDefined()
    expect(declared.childrenOf('Nytteoversikt').declares('Gevinstoppfølging', '')).toBeDefined()
    expect(declared.declares('Gevinstoppfølging', '')).toBeUndefined()
    expect(declared.declares('Gevinster', '')).toBeUndefined()
  })

  it('has an empty level under a title it does not declare, and declares nothing without schemas', () => {
    expect(declared.childrenOf('Banekart').declares('Nytteoppfølging', '')).toBeUndefined()
    expect(
      declared
        .childrenOf('Banekart')
        .declares('Kart', '/sites/pp/frisbee/SitePages/Nytteoversikt.aspx')
    ).toBeDefined()
    expect(
      TemplateQuickLaunch.of(undefined, BASE).declares('Hjem', 'SitePages/ProjectHome.aspx')
    ).toBeUndefined()
  })
})

/** A menu as `[title, url, children]`. */
type Menu = Array<[string, string, Menu?]>

/** The menu as a schema's `Navigation.QuickLaunch` declares it. */
const toNodes = (menu: Menu): NavigationNodes =>
  menu.map(([Title, Url, children]) => ({ Title, Url, Children: children && toNodes(children) }))

/**
 * The module as it runs on an en-US site: with `SharedResources` in English, the site's language,
 * since the setup turns off the site's alternative languages first.
 */
function inEnglish(): { en: typeof resource; EnglishQuickLaunch: typeof TemplateQuickLaunch } {
  let english: { en: typeof resource; EnglishQuickLaunch: typeof TemplateQuickLaunch }
  jest.isolateModules(() => {
    const en = jest.requireActual('../../loc/shared/en-us')
    jest.doMock('SharedResources', () => en)
    english = {
      en,
      EnglishQuickLaunch: jest.requireActual('./templateQuickLaunch').TemplateQuickLaunch
    }
  })
  jest.dontMock('SharedResources')
  return english!
}

describe('TemplateQuickLaunch on an en-US project from 1.11', () => {
  const { en, EnglishQuickLaunch } = inEnglish()
  const page = (name: string) => `SitePages/${name}`

  // The en-US templates' Quick Launch now: `Templates/JsonTemplates/_JsonTemplate*.json` with the
  // en-US resources.
  const DEFAULT_TEMPLATE: Menu = [
    [en.Navigation_Home_Title, 'SitePages/ProjectHome.aspx'],
    [en.Navigation_ProjectStatus_Title, page(en.ClientSidePages_ProjectStatus_Name)],
    [en.Navigation_ProjectLog_Title, en.Navigation_ProjectLog_Url],
    [en.Navigation_StakeholderRegister_Title, en.Navigation_StakeholderRegister_Url],
    [en.Navigation_CommunicationPlan_Title, en.Navigation_CommunicationPlan_Url],
    [en.Navigation_Uncertainty_Title, en.Navigation_Uncertainty_Url],
    [en.Navigation_Documents_Title, en.Navigation_Documents_Url],
    [en.Navigation_Tasks_Title, page(en.ClientSidePages_Tasks_PageName)],
    [en.Navigation_PhaseChecklist_Title, en.Navigation_PhaseChecklist_Url],
    [en.Navigation_Notebook_Title, '#'],
    [
      en.Navigation_BenefitsOverview_Title,
      page(en.ClientSidePages_BenefitOverview_PageName),
      [
        [en.Navigation_ChangeAnalysis_Title, en.Navigation_ChangeAnalysis_Url],
        [en.Navigation_BenefitsAnalysis_Title, `${en.Lists_BenefitsAnalysis_Url}/AllItems.aspx`],
        [en.Navigation_MeasurementIndicators_Title, en.Navigation_MeasurementIndicators_Url],
        [en.Navigation_BenefitsFollowup_Title, en.Navigation_BenefitsFollowup_Url],
        [en.Navigation_BenefitsOverview_Title, page(en.ClientSidePages_BenefitOverview_PageName)]
      ]
    ],
    [en.Navigation_ProjectDeliveries_Title, en.Navigation_ProjectDeliveries_Url],
    [en.Navigation_ResourceAllocation_Title, en.Navigation_ResourceAllocation_Url],
    [en.Navigation_ProjectTimeline_Title, page(en.ClientSidePages_ProjectTimeline_PageName)],
    [en.Navigation_SiteContent_Title, '_layouts/15/viewlsts.aspx']
  ]
  const PROGRAM_TEMPLATE: Menu = [
    [en.Navigation_Home_Title, 'SitePages/ProgramHome.aspx'],
    [en.ClientSidePages_ProgramStatus_Title, page(en.ClientSidePages_ProgramStatus_Name)],
    [
      en.Navigation_ProgramContent_Title,
      page(en.ClientSidePages_ProgramOverview_PageName),
      [
        [en.ClientSidePages_ParentAdmin_Title, page(en.ClientSidePages_ParentAdmin_PageName)],
        [
          en.ClientSidePages_ProgramOverview_Title,
          page(en.ClientSidePages_ProgramOverview_PageName)
        ],
        [
          en.ClientSidePages_ProgramBenefitOverview_Title,
          page(en.ClientSidePages_ProgramBenefitOverview_PageName)
        ],
        [
          en.ClientSidePages_ProgramTimeline_Title,
          page(en.ClientSidePages_ProgramTimeline_PageName)
        ],
        [
          en.ClientSidePages_ProgramDeliveries_Title,
          page(en.ClientSidePages_ProgramDeliveries_PageName)
        ],
        [
          en.ClientSidePages_ProgramUncertainties_Title,
          page(en.ClientSidePages_ProgramUncertainties_PageName)
        ],
        [
          en.ClientSidePages_ProgamCommunicationPlan_Title,
          page(en.ClientSidePages_ProgramCommunicationPlan_PageName)
        ],
        [
          en.ClientSidePages_ProgramResourceAllocation_Title,
          page(en.ClientSidePages_ProgramResourceAllocation_PageName)
        ]
      ]
    ],
    [en.Navigation_Documents_Title, en.Navigation_Documents_Url],
    [en.Lists_ProgramDeliveries_Title, `${en.Lists_ProgramDeliveries_Url}/AllItems.aspx`],
    [
      en.ClientSidePages_ProgramProjectTimeline_Title,
      page(en.ClientSidePages_ProgramProjectTimeline_PageName)
    ],
    [en.Navigation_SiteContent_Title, '_layouts/15/viewlsts.aspx']
  ]
  const PARENT_TEMPLATE: Menu = [
    [
      en.Navigation_ChildContent_Title,
      page(en.ClientSidePages_ParentOverview_PageName),
      [
        [en.ClientSidePages_ParentAdmin_Title, page(en.ClientSidePages_ParentAdmin_PageName)],
        [en.ClientSidePages_ParentOverview_Title, page(en.ClientSidePages_ParentOverview_PageName)],
        [
          en.ClientSidePages_ParentBenefitOverview_Title,
          page(en.ClientSidePages_ParentBenefitOverview_PageName)
        ],
        [en.ClientSidePages_ParentTimeline_Title, page(en.ClientSidePages_ParentTimeline_PageName)],
        [
          en.ClientSidePages_ParentDeliveries_Title,
          page(en.ClientSidePages_ParentDeliveries_PageName)
        ],
        [
          en.ClientSidePages_ParentUncertainties_Title,
          page(en.ClientSidePages_ParentUncertainties_PageName)
        ],
        [
          en.ClientSidePages_ParentCommunicationPlan_Title,
          page(en.ClientSidePages_ParentCommunicationPlan_PageName)
        ],
        [
          en.ClientSidePages_ParentResourceAllocation_Title,
          page(en.ClientSidePages_ParentResourceAllocation_PageName)
        ]
      ]
    ]
  ]

  // The same menus in 1.11.0, in Norwegian, as `git show
  // v1.11.0:Templates/JsonTemplates/_JsonTemplate{Project,Program,Parent}.json` has them: the en-US
  // templates got the titles unchanged. Each node is in the place of the node that replaced it.
  const DEFAULT_TEMPLATE_1_11: Menu = [
    ['Hjem', 'SitePages/ProjectHome.aspx'],
    ['Prosjektstatus', 'SitePages/Prosjektstatus.aspx'],
    ['Prosjektlogg', 'Lists/Prosjektlogg/AllItems.aspx'],
    ['Interessentregister', 'Lists/Interessentregister/AllItems.aspx'],
    ['Kommunikasjonsplan', 'Lists/Kommunikasjonsplan/AllItems.aspx'],
    ['Usikkerhet', 'Lists/Usikkerhet/AllItems.aspx'],
    ['Dokumenter', 'Dokumenter/Forms/AllItems.aspx'],
    ['Oppgaver', 'SitePages/Oppgaver.aspx'],
    ['Fasesjekkliste', 'Lists/Fasesjekkliste/AllItems.aspx'],
    ['Notatblokk', '#'],
    [
      'Gevinstarbeid',
      'SitePages/Gevinstoversikt.aspx',
      [
        ['Endringsanalyse', 'Lists/Endringsanalyse/AllItems.aspx'],
        [
          'Gevinstanalyse og gevinstrealiseringsplan',
          'Lists/Gevinstanalyse og gevinstrealiseringsplan/AllItems.aspx'
        ],
        ['Måleindikatorer', 'Lists/Mleindikatorer/AllItems.aspx'],
        ['Gevinstoppfølging', 'Lists/Gevinstoppflging/AllItems.aspx'],
        ['Gevinstoversikt', 'SitePages/Gevinstoversikt.aspx']
      ]
    ],
    ['Prosjektleveranser', 'Lists/Prosjektleveranser/AllItems.aspx'],
    ['Ressursallokering', 'Lists/Ressursallokering/AllItems.aspx'],
    ['Prosjekttidslinje', 'SitePages/Prosjekttidslinje.aspx'],
    ['Områdeinnhold', '_layouts/15/viewlsts.aspx']
  ]
  const PROGRAM_TEMPLATE_1_11: Menu = [
    ['Hjem', 'SitePages/ProgramHome.aspx'],
    ['Programstatus', 'SitePages/Status.aspx'],
    [
      'Programinnhold',
      'SitePages/ProgramOversikt.aspx',
      [
        ['Administrasjon', 'SitePages/Admin.aspx'],
        ['Oversikt', 'SitePages/ProgramOversikt.aspx'],
        ['Gevinster', 'SitePages/ProgramGevinster.aspx'],
        ['Tidslinje', 'SitePages/ProgramTidslinje.aspx'],
        ['Leveranser', 'SitePages/ProgramLeveranser.aspx'],
        ['Usikkerheter', 'SitePages/ProgramUsikkerheter.aspx'],
        ['Kommunikasjonsplaner', 'SitePages/ProgramKommunikasjon.aspx'],
        ['Ressursallokeringer', 'SitePages/ProgramRessursallokeringer.aspx']
      ]
    ],
    ['Dokumenter', 'Dokumenter/Forms/AllItems.aspx'],
    ['Programleveranser', 'Lists/Programleveranser/AllItems.aspx'],
    ['Programtidslinje', 'SitePages/Tidslinje.aspx']
  ]
  const PARENT_TEMPLATE_1_11: Menu = [
    [
      'Underordnet innhold',
      'SitePages/OverordnetOversikt.aspx',
      [
        ['Administrasjon', 'SitePages/Admin.aspx'],
        ['Oversikt', 'SitePages/OverordnetOversikt.aspx'],
        ['Gevinster', 'SitePages/OverordnetGevinster.aspx'],
        ['Tidslinje', 'SitePages/OverordnetTidslinje.aspx'],
        ['Leveranser', 'SitePages/OverordnetLeveranser.aspx'],
        ['Usikkerheter', 'SitePages/OverordnetUsikkerheter.aspx'],
        ['Kommunikasjonsplaner', 'SitePages/OverordnetKommunikasjon.aspx'],
        ['Ressursallokeringer', 'SitePages/OverordnetRessursallokeringer.aspx']
      ]
    ]
  ]

  it.each([
    ['DefaultTemplate', DEFAULT_TEMPLATE_1_11, DEFAULT_TEMPLATE],
    ['ProgramTemplate', PROGRAM_TEMPLATE_1_11, PROGRAM_TEMPLATE],
    ['ParentTemplate', PARENT_TEMPLATE_1_11, PARENT_TEMPLATE]
  ])(
    "declares each node of the 1.11 %s, at its level, as the template's node that replaced it",
    (_, old, now) => {
      const declared = EnglishQuickLaunch.of([toNodes(now)], BASE)
      old.forEach(([title, url, children = []], index) => {
        const [successor, , successorChildren] = now[index]
        expect(declared.declares(title, url)).toBe(
          `it is the template's '${successor}' under an earlier title`
        )
        children.forEach(([child, childUrl], position) => {
          expect(declared.childrenOf(successor).declares(child, childUrl)).toBe(
            `it is the template's '${successorChildren[position][0]}' under an earlier title`
          )
        })
      })
    }
  )

  it('declares no link an owner added, nor a Norwegian title where the level has no title that replaced it', () => {
    const declared = EnglishQuickLaunch.of([toNodes(DEFAULT_TEMPLATE)], BASE)
    expect(declared.declares('Banekart', 'https://kart.contoso.no/frisbee')).toBeUndefined()
    expect(declared.declares('Oversikt', 'SitePages/Oversikt.aspx')).toBeUndefined()
    expect(declared.declares('Programinnhold', 'SitePages/Programinnhold.aspx')).toBeUndefined()
    expect(
      declared
        .childrenOf(en.Navigation_BenefitsOverview_Title)
        .declares('Prosjektstatus', 'https://status.contoso.no')
    ).toBeUndefined()
  })

  it("declares none of the project's 1.11 menu in the parent template's, so a promotion keeps it", () => {
    const declared = EnglishQuickLaunch.of([toNodes(PARENT_TEMPLATE)], BASE)
    DEFAULT_TEMPLATE_1_11.forEach(([title, url]) => {
      expect(declared.declares(title, url)).toBeUndefined()
    })
  })
})
