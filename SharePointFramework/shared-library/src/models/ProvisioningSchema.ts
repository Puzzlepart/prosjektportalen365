/**
 * A provisioning template as consumed by `sp-js-provisioning`'s `WebProvisioner.applyTemplate`.
 *
 * `pp365-shared-library` only ever reads a handful of top level keys from a template and never
 * runs one, so the type is declared structurally here instead of importing `Schema` from
 * `sp-js-provisioning`. That keeps the published library free of a runtime-irrelevant dependency
 * whose PnPjs major must otherwise be kept in lockstep with ours.
 *
 * The keys mirror the top level of `sp-js-provisioning`'s `Schema`. Structured members are typed
 * `any` on purpose: a `Record<string, any>` is NOT assignable to an interface with required
 * members (for example `IComposedLook`, `ITaxonomy`), and consumers hand these objects straight
 * to `applyTemplate(schema: Schema)`. `any` keeps the two types mutually assignable without
 * duplicating the provisioning engine's type tree here.
 */
export interface ProvisioningSchema {
  Parameters?: Record<string, string>
  Version?: string
  Hooks?: any[]
  Navigation?: any
  CustomActions?: any[]
  ComposedLook?: any
  WebSettings?: any
  Features?: any[]
  Lists?: any[]
  Files?: any[]
  PropertyBagEntries?: any[]
  ClientSidePages?: any[]
  SiteFields?: string[]
  ContentTypes?: any[]
  Taxonomy?: any
  [key: string]: any
}
