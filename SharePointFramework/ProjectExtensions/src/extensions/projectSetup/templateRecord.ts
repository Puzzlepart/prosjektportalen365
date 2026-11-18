import { recordListContent } from './listContentRecord'

/**
 * What a project records in its properties (`Prosjektegenskaper`) about its template and
 * extensions, as `SetupProjectInformation` writes it.
 */
export interface ITemplateRecord {
  GtProjectTemplate?: string
  GtProjectExtensions?: string
  GtIsProgram?: boolean
  GtIsParentProject?: boolean
}

/**
 * What a setup records about the template and extensions it applied. A setup without a template
 * only adds extensions, so the project keeps the template and the program or parent status it
 * has, and the new extensions are added to its own. The front page reads the template's field
 * settings by its name, and a program that lost `GtIsProgram` was offered to become a parent.
 *
 * @param template The template the setup applied, or the no-template option
 * @param extensions The extensions the setup applied
 * @param stored What the project's properties have, given only for a setup without a template
 */
export function recordTemplate(
  template: { text: string; isProgram: boolean; isParentProject: boolean },
  extensions: Array<{ text: string }>,
  stored?: ITemplateRecord
): ITemplateRecord {
  if (!stored) {
    return {
      GtIsProgram: template.isProgram,
      GtIsParentProject: template.isParentProject,
      GtProjectTemplate: template.text,
      GtProjectExtensions: extensions.map((extension) => extension.text).join(', ')
    }
  }
  return {
    GtIsProgram: stored.GtIsProgram ?? template.isProgram,
    GtIsParentProject: stored.GtIsParentProject ?? template.isParentProject,
    GtProjectTemplate: stored.GtProjectTemplate || template.text,
    // The same record as the list content: titles separated by `, `, within 255 characters.
    GtProjectExtensions: recordListContent(stored.GtProjectExtensions, extensions)
  }
}
