import resource from 'SharedResources'
import type { NavigationNodes } from './tasks'

/**
 * The web a menu URL is resolved against.
 */
export interface IMenuUrlBase {
  /** The web's absolute URL, `https://contoso.sharepoint.com/sites/prosjekt` */
  webUrl: string

  /** The site collection's absolute URL, for `{site}` and `{sitecollection}` */
  siteUrl: string
}

/**
 * The Quick Launch of the en-US templates up to 1.11.1, per template and level: Norwegian titles,
 * each with the title the template has in its place now. The titles were written in Norwegian in
 * `Templates/JsonTemplates/_JsonTemplate{Project,Program,Parent}.json` (`git show
 * v1.11.0:Templates/JsonTemplates/_JsonTemplateProject.json`; every tag from 1.5.0 to 1.11.1 has
 * these titles or some of them), and the script that generated the templates
 * (`generateJsonTemplates.js`, from 1.9 `Templates/.tasks/generateProjectTemplates.js`) replaced
 * only `{{tokens}}`, so it copied them unchanged into the en-US `DefaultTemplate`,
 * `ProgramTemplate` and `ParentTemplate`. 1.12.0 made them the `{{Navigation_*_Title}}` and
 * `{{ClientSidePages_*_Title}}` tokens the templates still have. On a Norwegian project they are
 * the current titles, but for the benefit titles `renamedTemplateTitles` lists as well, so they
 * change nothing there.
 */
const norwegianMenuOfEnglishTemplates = (): Array<[string, string]> => [
  // DefaultTemplate (Standardmal), top level
  ['Hjem', resource.Navigation_Home_Title],
  ['Prosjektstatus', resource.Navigation_ProjectStatus_Title],
  ['Prosjektlogg', resource.Navigation_ProjectLog_Title],
  ['Interessentregister', resource.Navigation_StakeholderRegister_Title],
  ['Kommunikasjonsplan', resource.Navigation_CommunicationPlan_Title],
  ['Usikkerhet', resource.Navigation_Uncertainty_Title],
  ['Dokumenter', resource.Navigation_Documents_Title],
  ['Oppgaver', resource.Navigation_Tasks_Title],
  ['Fasesjekkliste', resource.Navigation_PhaseChecklist_Title],
  ['Notatblokk', resource.Navigation_Notebook_Title],
  ['Gevinstarbeid', resource.Navigation_BenefitsOverview_Title],
  ['Prosjektleveranser', resource.Navigation_ProjectDeliveries_Title],
  ['Ressursallokering', resource.Navigation_ResourceAllocation_Title],
  ['Prosjekttidslinje', resource.Navigation_ProjectTimeline_Title],
  ['Områdeinnhold', resource.Navigation_SiteContent_Title],
  // DefaultTemplate, under Gevinstarbeid
  ['Endringsanalyse', resource.Navigation_ChangeAnalysis_Title],
  ['Gevinstanalyse og gevinstrealiseringsplan', resource.Navigation_BenefitsAnalysis_Title],
  ['Måleindikatorer', resource.Navigation_MeasurementIndicators_Title],
  ['Gevinstoppfølging', resource.Navigation_BenefitsFollowup_Title],
  ['Gevinstoversikt', resource.Navigation_BenefitsOverview_Title],
  // ProgramTemplate (Programmal), top level
  ['Hjem', resource.Navigation_Home_Title],
  ['Programstatus', resource.ClientSidePages_ProgramStatus_Title],
  ['Programinnhold', resource.Navigation_ProgramContent_Title],
  ['Dokumenter', resource.Navigation_Documents_Title],
  ['Programleveranser', resource.Lists_ProgramDeliveries_Title],
  ['Programtidslinje', resource.ClientSidePages_ProgramProjectTimeline_Title],
  // ProgramTemplate, under Programinnhold (Kommunikasjonsplaner from 1.9, Ressursallokeringer
  // from 1.10)
  ['Administrasjon', resource.ClientSidePages_ParentAdmin_Title],
  ['Oversikt', resource.ClientSidePages_ProgramOverview_Title],
  ['Gevinster', resource.ClientSidePages_ProgramBenefitOverview_Title],
  ['Tidslinje', resource.ClientSidePages_ProgramTimeline_Title],
  ['Leveranser', resource.ClientSidePages_ProgramDeliveries_Title],
  ['Usikkerheter', resource.ClientSidePages_ProgramUncertainties_Title],
  ['Kommunikasjonsplaner', resource.ClientSidePages_ProgamCommunicationPlan_Title],
  ['Ressursallokeringer', resource.ClientSidePages_ProgramResourceAllocation_Title],
  // ParentTemplate (Overordnet), top level
  ['Underordnet innhold', resource.Navigation_ChildContent_Title],
  // ParentTemplate, under Underordnet innhold (as under Programinnhold)
  ['Administrasjon', resource.ClientSidePages_ParentAdmin_Title],
  ['Oversikt', resource.ClientSidePages_ParentOverview_Title],
  ['Gevinster', resource.ClientSidePages_ParentBenefitOverview_Title],
  ['Tidslinje', resource.ClientSidePages_ParentTimeline_Title],
  ['Leveranser', resource.ClientSidePages_ParentDeliveries_Title],
  ['Usikkerheter', resource.ClientSidePages_ParentUncertainties_Title],
  ['Kommunikasjonsplaner', resource.ClientSidePages_ParentCommunicationPlan_Title],
  ['Ressursallokeringer', resource.ClientSidePages_ParentResourceAllocation_Title]
]

/**
 * The Quick Launch titles the PP365 templates had before a rename, with the titles that replaced
 * them (the templates' current text, from `SharedResources`). The old titles are menu titles the
 * templates had up to 1.14.1 that the template in the same language no longer has, and the old
 * titles the v6 rename renames on existing projects (`$NavRetitleMap` in
 * `Install/Scripts/UpgradeAllSitesToLatest/EnsureV6BenefitTerminology.ps1`). Most of their pages
 * and lists have other names in the templates now too, so their URLs do not tell them apart from a
 * link an owner added.
 *
 * Since 1.12.0 the titles are `Navigation_*_Title` and the program and parent pages'
 * `ClientSidePages_*_Title` in `Templates/Portfolio/Resources.*.resx`. Up to 1.11 the en-US
 * templates had the Norwegian ones: see {@link norwegianMenuOfEnglishTemplates}.
 *
 * A title is listed once for each template and level that had it, with that node's new title.
 * `SharedResources` is in the user's language, which is the site's, and so the template's, once the
 * setup has turned off the site's alternative languages (`_removeAlternativeLanguages` in
 * `index.ts`).
 */
const renamedTemplateTitles = (): Array<{ old: string[]; current: string[] }> => [
  // Gevinstarbeid until 1.11, Gevinstoversikt in 1.12 and 1.13 (and the child of either)
  {
    old: ['Gevinstarbeid', 'Gevinstoversikt'],
    current: [resource.Navigation_BenefitsOverview_Title]
  },
  {
    old: ['Gevinstanalyse og gevinstrealiseringsplan', 'Benefits Analysis and Realization Plan'],
    current: [resource.Navigation_BenefitsAnalysis_Title]
  },
  {
    old: ['Gevinstoppfølging', 'Benefits Followup', 'Benefits follow-up'],
    current: [resource.Navigation_BenefitsFollowup_Title]
  },
  // Under Programinnhold (Programmal) and Underordnet innhold (Overordnet)
  {
    old: ['Gevinster'],
    current: [
      resource.ClientSidePages_ProgramBenefitOverview_Title,
      resource.ClientSidePages_ParentBenefitOverview_Title
    ]
  },
  // 1.12.0
  { old: ['Notatbok'], current: [resource.Navigation_Notebook_Title] },
  ...norwegianMenuOfEnglishTemplates().map(([old, current]) => ({ old: [old], current: [current] }))
]

/**
 * A menu URL in the form SharePoint stores it, for comparison only, as sp-js-provisioning compares
 * a template's URL with a stored one: the URL tokens replaced, a web-relative URL resolved against
 * the web, an absolute URL on the web's origin made server-relative, and the path decoded, without
 * a trailing slash and in lower case. A URL on another host is kept as it is. `undefined` for a URL
 * that names no page: empty, `#` (a heading, the template's `Notatblokk`) or a heading's
 * `http://linkless.header/`.
 *
 * @param url The URL
 * @param base The web it is resolved against
 */
export function normaliseMenuUrl(url: string | undefined, base: IMenuUrlBase): string | undefined {
  const { origin, pathname } = new URL(base.webUrl)
  const site = new URL(base.siteUrl)
  const text = `${url ?? ''}`
    .replace(/{sitecollection}/g, base.siteUrl.replace(/\/$/, ''))
    .replace(/{site}/g, site.pathname.replace(/\/$/, ''))
    .replace(/{hosturl}/g, origin)
    .trim()
  if (!text || text.startsWith('#') || /^http:\/\/linkless\.header\/?$/i.test(text)) {
    return undefined
  }
  let path: string
  if (/^[a-z][\d+.a-z-]*:/i.test(text)) {
    const lower = text.toLowerCase()
    const host = origin.toLowerCase()
    if (lower !== host && !lower.startsWith(`${host}/`)) return text
    path = text.slice(origin.length) || '/'
  } else {
    path = text.startsWith('/') ? text : `${pathname.replace(/\/$/, '')}/${text}`
  }
  const cut = path.search(/[#?]/)
  const head = cut === -1 ? path : path.slice(0, cut)
  const tail = cut === -1 ? '' : path.slice(cut)
  const decoded = head
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
    .join('/')
  return `${decoded.replace(/\/+$/, '') || '/'}`.toLowerCase() + tail
}

/**
 * The Quick Launch that the template and the selected extensions declare, one level of it, for
 * the restore after the setup ran again: it tells a saved node that is the template's own from a
 * link an owner added.
 */
export class TemplateQuickLaunch {
  private constructor(
    private readonly _nodes: NavigationNodes,
    private readonly _urls: Set<string>,
    private readonly _base: IMenuUrlBase
  ) {}

  /**
   * The top level of the menus the schemas declare.
   *
   * @param menus The `Navigation.QuickLaunch` of each schema (the template's before an extension's
   * replaced it, then each extension's)
   * @param base The web the URLs are resolved against
   */
  public static of(menus: NavigationNodes[] = [], base: IMenuUrlBase): TemplateQuickLaunch {
    const nodes = menus.filter(Array.isArray).flat()
    const urls = new Set<string>()
    const collect = (level: NavigationNodes) =>
      level.forEach((node) => {
        const url = normaliseMenuUrl(node?.Url, base)
        if (url !== undefined) urls.add(url)
        if (Array.isArray(node?.Children)) collect(node.Children)
      })
    collect(nodes)
    return new TemplateQuickLaunch(nodes, urls, base)
  }

  /**
   * Why a saved node of this level is the template's own, or `undefined` for a link an owner added:
   * the level declares its title, or a title that replaced it (a node of an earlier version of the
   * template; a title several templates or levels had has one for each), or a schema declares its
   * URL at any level.
   *
   * @param title The saved node's title
   * @param url The saved node's URL
   */
  public declares(title: string, url: string): string | undefined {
    const titles = new Set(this._nodes.map((node) => node?.Title))
    if (titles.has(title)) return 'its title is declared at its level'
    const current = renamedTemplateTitles()
      .filter(({ old }) => old.includes(title))
      .flatMap((renamed) => renamed.current)
      .find((successor) => titles.has(successor))
    if (current) return `it is the template's '${current}' under an earlier title`
    const normalised = normaliseMenuUrl(url, this._base)
    if (normalised !== undefined && this._urls.has(normalised)) return 'its URL is declared'
    return undefined
  }

  /**
   * The level under the nodes of this level with `title`: empty under a title the level does not
   * declare. The URLs are those of the whole menu.
   *
   * @param title The parent's title
   */
  public childrenOf(title: string): TemplateQuickLaunch {
    return new TemplateQuickLaunch(
      this._nodes
        .filter((node) => node?.Title === title && Array.isArray(node.Children))
        .flatMap((node) => node.Children),
      this._urls,
      this._base
    )
  }
}
