import type { IWeb } from '@pnp/sp/webs'
import { TEMPLATE_PACKAGE_STORE_FOLDER } from 'pp365-shared-library'
import { Schema } from 'sp-js-provisioning'

/**
 * The name the template package catalog stores an imported package's project template under, in
 * `pp-packages/<PpPkgId>/` of the hub's Template Library: the last part of the manifest's
 * `provisioning.template`, which is `provisioning/template.json` in every package.
 */
export const PACKAGE_TEMPLATE_FILE_NAME = 'template.json'

/**
 * The keys of a schema that apply nothing by themselves.
 */
const NON_HANDLER_KEYS = ['$schema', 'Parameters', 'Version']

/**
 * The schemas a setup applies for a template: the base template and a package's own on top of it.
 */
export interface ITemplateLayers {
  /** The base template (Standardmal for a catalog template), with the parameters of both. */
  templateSchema: Schema

  /** The package's own project template, applied after the base; none when it applies nothing. */
  packageTemplateSchema?: Schema
}

/**
 * Merges a package template's parameters over the base template's, the term sets key by key, so
 * the content types and term set a package declares apply to the setup.
 *
 * @param base The base template's `Parameters`
 * @param pkg The package template's `Parameters`
 */
export function mergeTemplateParameters(
  base: Record<string, any> = {},
  pkg: Record<string, any> = {}
): Record<string, any> {
  return {
    ...base,
    ...pkg,
    TermSetIds: { ...(base.TermSetIds ?? {}), ...(pkg.TermSetIds ?? {}) }
  }
}

/**
 * Lays a template package's own project template on top of the base template. The catalog's
 * packages are written for that: their lists bind the content types the base template makes, so a
 * package template applied alone left its lists without them, and an imported one was never
 * applied at all.
 *
 * @param base The base template's schema, with the Maloppsett row's parameters
 * @param pkg The package's own project template, if it has one
 */
export function layerPackageTemplate(base: Schema, pkg?: Schema): ITemplateLayers {
  if (!pkg) return { templateSchema: base }
  const Parameters = mergeTemplateParameters(base.Parameters, pkg.Parameters)
  const appliesSomething = Object.keys(pkg).some((key) => !NON_HANDLER_KEYS.includes(key))
  return {
    templateSchema: { ...base, Parameters },
    ...(appliesSomething && { packageTemplateSchema: { ...pkg, Parameters } })
  }
}

/**
 * Reads an imported package's own project template from the hub's Template Library, where the
 * catalog stored it on import. Returns nothing when the package has none.
 *
 * @param hubWeb The hub's web
 * @param libraryTitle The title of the hub's Template Library (Malbibliotek)
 * @param packageId The package's id (`PpPkgId`)
 */
export async function getImportedPackageTemplate(
  hubWeb: IWeb,
  libraryTitle: string,
  packageId: string
): Promise<Schema | undefined> {
  const root = await hubWeb.lists.getByTitle(libraryTitle).rootFolder.select('ServerRelativeUrl')()
  const url = [
    root.ServerRelativeUrl,
    TEMPLATE_PACKAGE_STORE_FOLDER,
    packageId,
    PACKAGE_TEMPLATE_FILE_NAME
  ].join('/')
  try {
    return await hubWeb.getFileByServerRelativePath(url).getJSON()
  } catch (error) {
    if (error?.status === 404) return undefined
    throw error
  }
}
