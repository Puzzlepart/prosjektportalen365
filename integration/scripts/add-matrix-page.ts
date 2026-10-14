import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spfi } from '@pnp/sp'
import '@pnp/sp/presets/all.js'
import { ClientsideWebpart } from '@pnp/sp/clientside-pages/index.js'
import type { IClientsidePageComponent } from '@pnp/sp/clientside-pages/index.js'
import { signedIn } from '../src/auth.ts'
import { authMode } from '../src/env.ts'

/**
 * Adds a page with the risk and opportunity matrix web parts to a project site, for the browser
 * suite's matrix smoke (`e2e/tests/smoke/matrices.spec.ts`): no template page holds the two web
 * parts. Signed in as the harness signs in (the e2e user's session from `e2e/.auth/user.json`,
 * else the CI certificate). The page is an article page with one web part per section, each with
 * the properties the toolbox gives it (its manifest's first preconfigured entry), published.
 * Nothing happens when the page exists, unless `--replace` recycles it first.
 *
 *   npm run add-matrix-page -- https://tenant.sharepoint.com/sites/project [Usikkerhet.aspx] [test] [--replace]
 *
 * The third argument names the release channel whose components the page gets (`channels/`). A
 * tenant's app catalog can hold the same web part from many packages (on the test tenant, seven
 * risk matrices from 1.8.1 on), so only the channel's own component ids are accepted: a web part
 * from another package runs that package's code, which says nothing about the build under test.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const replace = args.includes('--replace')
const [siteUrl, pageName = 'Usikkerhet.aspx', channel = 'test'] = args.filter(
  (a) => a !== '--replace'
)
const WEB_PARTS = ['RiskMatrixWebPart', 'OpportunityMatrixWebPart'] as const

if (!siteUrl) {
  console.error(
    'Usage: node scripts/add-matrix-page.ts <site url> [page name] [channel] [--replace]'
  )
  process.exit(2)
}
const mode = authMode()
if (!mode) {
  console.error('No sign-in configured (see integration/.env.example)')
  process.exit(2)
}

/** A component id as the channel files write it: lower case, without braces. */
const normalizeId = (id: string) => id.replace(/[{}]/g, '').toLowerCase()

/** The component ids of the channel, from its file in `channels/`. */
function channelComponentIds(): Record<string, string> {
  const file = resolve(ROOT, '..', 'channels', `${channel}.json`)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
    spfx: { solutions: { ProjectWebParts: { components: Record<string, string> } } }
  }
  return parsed.spfx.solutions.ProjectWebParts.components
}

/** The alias and version a component's manifest names. */
function manifestOf(component: IClientsidePageComponent): { alias?: string; version?: string } {
  try {
    return JSON.parse(component.Manifest) as { alias?: string; version?: string }
  } catch {
    return {}
  }
}

/** The site's component with the channel's id for a web part; the other packages' are listed when it is missing. */
function findComponent(
  components: IClientsidePageComponent[],
  alias: string,
  id: string | undefined
): IClientsidePageComponent {
  const component = id && components.find((c) => normalizeId(c.Id) === normalizeId(id))
  if (!component) {
    const others = components
      .filter((c) => manifestOf(c).alias === alias)
      .map((c) => `${normalizeId(c.Id)} (${manifestOf(c).version ?? '?'})`)
    throw new Error(
      `${siteUrl} has no ${alias} with the ${channel} channel's id ${id ?? '(none in channels/)'}: ` +
        `is ProjectWebParts of the ${channel} channel installed on it? The site offers ${alias} as ` +
        (others.length ? others.join(', ') : 'nothing')
    )
  }
  return component
}

const site = siteUrl.replace(/\/+$/, '')
const sp = spfi(site).using(signedIn(mode, site))
const web = await sp.web.select('ServerRelativeUrl', 'Title')()
const pageUrl = `${web.ServerRelativeUrl}/SitePages/${pageName}`
const file = sp.web.getFileByServerRelativePath(pageUrl)
if (await file.exists()) {
  if (!replace) {
    console.log(
      `${site}/SitePages/${pageName} exists already; nothing added (--replace recycles it first)`
    )
    process.exit(0)
  }
  await file.recycle()
  console.log(`Recycled ${site}/SitePages/${pageName}`)
}

const ids = channelComponentIds()
const components = await sp.web.getClientsideWebParts()
const definitions = WEB_PARTS.map((alias) => findComponent(components, alias, ids[alias]))
const title = pageName.replace(/\.aspx$/i, '')
const page = await sp.web.addClientsidePage(pageName, title, 'Article')
for (const definition of definitions) {
  page.addSection().addControl(ClientsideWebpart.fromComponentDef(definition))
}
await page.save(true)
console.log(
  `Added and published ${site}/SitePages/${pageName} with ${definitions
    .map((d) => `${manifestOf(d).alias} ${normalizeId(d.Id)} (${manifestOf(d).version ?? '?'})`)
    .join(' and ')}`
)
