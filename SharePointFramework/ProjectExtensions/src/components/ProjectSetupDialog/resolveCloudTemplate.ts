import {
  CloudContentConfig,
  CloudProjectExtension,
  CloudTemplatePackage,
  ProjectTemplate
} from 'pp365-shared-library'
import { IResolvedCloudTemplate } from './types'

/**
 * Downloads a cloud package and builds its selectable models without provisioning the hub.
 *
 * @param template The selected cloud template `ProjectTemplate` (must be `isCloudTemplate`)
 */
export async function resolveCloudTemplate(
  template: ProjectTemplate
): Promise<IResolvedCloudTemplate> {
  const pkg = await CloudTemplatePackage.fromUrl(template.cloudSourceUrl)
  const extensions = (pkg.manifest.provisioning?.extensions ?? []).map((ext, index) =>
    CloudProjectExtension.fromManifest(ext, pkg, index + 1)
  )
  const contentConfig = (pkg.manifest.provisioning?.listContent ?? []).map((entry, index) =>
    CloudContentConfig.fromManifest(entry, pkg, index + 1)
  )
  return { templateId: template.id, package: pkg, extensions, contentConfig }
}
