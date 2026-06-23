import {
  CloudContentConfig,
  CloudProjectExtension,
  CloudTemplatePackage,
  ProjectTemplate
} from 'pp365-shared-library'
import { IResolvedCloudTemplate } from './types'

/**
 * Download and resolve a **cloud template** from its `.pppkg`: read the
 * manifest and build the bundled extension/list-content models that the wizard
 * (Extensions/List-content sections, and the `PreTask`/`CopyListData` tasks) use
 * to apply the cloud template to the project — without touching the hub.
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
