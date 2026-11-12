import resource from 'SharedResources'
import type { NavigationNodes } from './tasks'

/** Web and site-collection URLs used to resolve navigation tokens. */
export interface IMenuUrlBase {
  /** The web's absolute URL, `https://contoso.sharepoint.com/sites/prosjekt` */
  webUrl: string

  /** The site collection's absolute URL, for `{site}` and `{sitecollection}` */
  siteUrl: string
}

/**
 * Maps Norwegian menu titles shipped in en-US templates through 1.11.1 to their current titles.
 * Those templates contained literal Norwegian titles; localized tokens replaced them in 1.12.0.
 * Repeated titles retain the successor for each template and menu level that used them.
 */
const norwegianMenuOfEnglishTemplates = (): Array<[string, string]> => [
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
  ['Endringsanalyse', resource.Navigation_ChangeAnalysis_Title],
  ['Gevinstanalyse og gevinstrealiseringsplan', resource.Navigation_BenefitsAnalysis_Title],
  ['Måleindikatorer', resource.Navigation_MeasurementIndicators_Title],
  ['Gevinstoppfølging', resource.Navigation_BenefitsFollowup_Title],
  ['Gevinstoversikt', resource.Navigation_BenefitsOverview_Title],
  ['Hjem', resource.Navigation_Home_Title],
  ['Programstatus', resource.ClientSidePages_ProgramStatus_Title],
  ['Programinnhold', resource.Navigation_ProgramContent_Title],
  ['Dokumenter', resource.Navigation_Documents_Title],
  ['Programleveranser', resource.Lists_ProgramDeliveries_Title],
  ['Programtidslinje', resource.ClientSidePages_ProgramProjectTimeline_Title],
  ['Administrasjon', resource.ClientSidePages_ParentAdmin_Title],
  ['Oversikt', resource.ClientSidePages_ProgramOverview_Title],
  ['Gevinster', resource.ClientSidePages_ProgramBenefitOverview_Title],
  ['Tidslinje', resource.ClientSidePages_ProgramTimeline_Title],
  ['Leveranser', resource.ClientSidePages_ProgramDeliveries_Title],
  ['Usikkerheter', resource.ClientSidePages_ProgramUncertainties_Title],
  ['Kommunikasjonsplaner', resource.ClientSidePages_ProgamCommunicationPlan_Title],
  ['Ressursallokeringer', resource.ClientSidePages_ProgramResourceAllocation_Title],
  ['Underordnet innhold', resource.Navigation_ChildContent_Title],
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
 * Maps historical and v6-renamed menu titles to their localized successors.
 * Renamed pages and lists also changed URLs, so URL matching alone cannot identify template links.
 *
 * SharedResources matches the site's template language after setup disables alternative languages.
 * Legacy en-US titles are included through {@link norwegianMenuOfEnglishTemplates}.
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
  {
    old: ['Gevinster'],
    current: [
      resource.ClientSidePages_ProgramBenefitOverview_Title,
      resource.ClientSidePages_ParentBenefitOverview_Title
    ]
  },
  { old: ['Notatbok'], current: [resource.Navigation_Notebook_Title] },
  ...norwegianMenuOfEnglishTemplates().map(([old, current]) => ({ old: [old], current: [current] }))
]

/**
 * Normalizes same-origin menu paths for comparison, resolving tokens and preserving query and hash.
 * External URLs are unchanged; local paths are decoded, lowercased and stripped of trailing slashes.
 *
 * @returns Undefined for empty URLs and heading-only links.
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
 * Identifies template-owned links at one menu level so restoration adds only owner-created links.
 */
export class TemplateQuickLaunch {
  private constructor(
    private readonly _nodes: NavigationNodes,
    private readonly _urls: Set<string>,
    private readonly _base: IMenuUrlBase
  ) {}

  /**
   * Builds a top-level matcher from the original template and extension menu declarations.
   *
   * @param menus The `Navigation.QuickLaunch` of each schema (the template's before an extension's
   * replaced it, then each extension's)
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
   * Explains template ownership by current or historical title at this level, or by URL at any level.
   *
   * @returns Undefined when no template declaration matches the saved link.
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
   * Builds a matcher for declared children of the named parent, retaining whole-menu URL matching.
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
