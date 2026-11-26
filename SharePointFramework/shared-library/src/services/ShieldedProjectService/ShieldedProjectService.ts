import { Logger, LogLevel } from '@pnp/logging'
import { IList } from '@pnp/sp/lists'
import '@pnp/sp/presets/all'
import { IWeb } from '@pnp/sp/webs'
import strings from 'SharedLibraryStrings'
import initJsom, { ExecuteJsomQuery as executeQuery, JsomContext } from 'spfx-jsom'
import { ISPContentType } from '../../interfaces'
import { format, transformFieldXml } from '../../util'
import { getContentTypeLineage, isListContentTypeOf } from './contentTypeLineage'
import { getMissingListFields, IListFieldSchema } from './listFields'
import { EnsureProjectDataListParams, EnsureProjectDataListResult } from './types'

/**
 * `SP.ContentTypeCreationInformation` with the ID of the content type to make. SharePoint
 * Online's `sp.js` has `set_id`; the typings (`@types/sharepoint`) are older.
 */
type ContentTypeCreationInformationWithId = SP.ContentTypeCreationInformation & {
  set_id(value: string): void
}

/**
 * What a step failed with, as text for the log. A JSOM query rejects with `{ sender, args }`,
 * which has no `message`: SharePoint's own is in `args`.
 *
 * @param error The caught value
 */
function failureText(error: any): string {
  return error?.message ?? error?.args?.get_message?.() ?? String(error)
}

/**
 * Sets up the lists a shielded project keeps its project data in, on its own site: the lists have
 * the titles of the hub lists they replace, and their items the hub's content types, created on
 * the project site with the same IDs and fields. The portfolio's searches for those content
 * types then find the items, trimmed to who has access to the project. Every step can be run
 * again: what is there already is kept.
 */
export class ShieldedProjectService {
  /**
   * @param _hubWeb The hub, where the content types are read
   * @param _projectWeb The project site
   * @param _projectUrl Absolute URL of the project site (for JSOM)
   */
  constructor(
    private _hubWeb: IWeb,
    private _projectWeb: IWeb,
    private _projectUrl: string
  ) {}

  /**
   * Ensures the list on the project site, with the hub content type and its fields, and read
   * access for the given groups.
   *
   * @param params Parameters
   */
  public async ensureList(
    params: EnsureProjectDataListParams
  ): Promise<EnsureProjectDataListResult> {
    const { list, created } = await this._projectWeb.lists.ensure(
      params.listName,
      '',
      params.template,
      !!params.contentTypeId,
      {
        Hidden: true,
        EnableVersioning: true,
        ...(params.template === 100 ? { EnableAttachments: false } : {})
      }
    )
    let listContentTypeId: string
    if (params.contentTypeId) {
      await this.ensureContentType(params.contentTypeId)
      listContentTypeId = await this._bindContentType(list, params.contentTypeId, created)
      await this._ensureFields(
        params.listName,
        params.contentTypeId,
        listContentTypeId,
        params.progressFunc
      )
    }
    if (params.includeHubListFields) {
      await this._ensureListFields(params.listName, params.progressFunc)
    }
    if (params.readerGroupNames?.length > 0) {
      await this.grantRead(list, params.readerGroupNames)
    }
    return { list, created, listContentTypeId }
  }

  /**
   * Ensures the content type on the project site with the ID it has on the hub, after the custom
   * content types it is built on. A content type created here has the hub's name and group; its
   * fields are added to the lists that use it (see `ensureList`).
   *
   * @param contentTypeId Content type ID
   */
  public async ensureContentType(contentTypeId: string): Promise<void> {
    const existing = new Set(
      (await this._projectWeb.contentTypes.select('StringId')<{ StringId: string }[]>()).map(
        ({ StringId }) => StringId.toLowerCase()
      )
    )
    for (const id of getContentTypeLineage(contentTypeId)) {
      if (existing.has(id.toLowerCase())) continue
      const { Name, Description, Group } = await this._hubWeb.contentTypes
        .getById(id)
        .select('Name', 'Description', 'Group')<{
        Name: string
        Description: string
        Group: string
      }>()
      Logger.write(
        `(ShieldedProjectService) (ensureContentType) Adding content type [${Name}] (${id}) to the project site.`,
        LogLevel.Info
      )
      await this._addContentType(id, Name, Description ?? '', Group)
    }
  }

  /**
   * Makes the content type on the project site with the given ID, through JSOM. The REST API
   * (`web.contentTypes.add`) leaves the ID out: it makes a child of Item with an ID of its own,
   * which no list can be given under the hub's ID, and no search for the hub's ID finds.
   *
   * @param id Content type ID, as on the hub
   * @param name Name
   * @param description Description
   * @param group Group
   */
  private async _addContentType(
    id: string,
    name: string,
    description: string,
    group: string
  ): Promise<void> {
    const { jsomContext } = await initJsom(this._projectUrl)
    const information =
      new SP.ContentTypeCreationInformation() as ContentTypeCreationInformationWithId
    // No parent: SharePoint reads it out of the ID, and refuses an ID together with a parent.
    information.set_id(id)
    information.set_name(name)
    information.set_description(description)
    information.set_group(group)
    const created = jsomContext.web.get_contentTypes().add(information)
    jsomContext.clientContext.load(created, 'StringId')
    await executeQuery(jsomContext)
    const storedId = created.get_stringId()
    if (storedId?.toLowerCase() !== id.toLowerCase()) {
      throw new Error(format(strings.ShieldedProjectContentTypeIdErrorText, name, storedId, id))
    }
  }

  /**
   * Gives the groups read access to the list, which then no longer inherits from the project
   * site: the site's own groups keep the access they had.
   *
   * @param list List
   * @param groupNames Names of the project site's groups
   */
  public async grantRead(list: IList, groupNames: string[]): Promise<void> {
    const { HasUniqueRoleAssignments } = await list.select('HasUniqueRoleAssignments')<{
      HasUniqueRoleAssignments: boolean
    }>()
    if (!HasUniqueRoleAssignments) await list.breakRoleInheritance(true, false)
    // Role type 2 is Reader, named after the site's language.
    const reader = await this._projectWeb.roleDefinitions.getByType(2).select('Id')<{
      Id: number
    }>()
    for (const groupName of groupNames) {
      try {
        const group = await this._projectWeb.siteGroups.getByName(groupName).select('Id')<{
          Id: number
        }>()
        await list.roleAssignments.add(group.Id, reader.Id)
      } catch (error) {
        Logger.write(
          `(ShieldedProjectService) (grantRead) Could not give the group [${groupName}] read access: ${failureText(error)}`,
          LogLevel.Warning
        )
      }
    }
  }

  /**
   * Gives the list's items the content type, with the given properties.
   *
   * @param listName Title of the list
   * @param listContentTypeId The list's own copy of the content type
   * @param properties Properties to set on every item
   */
  public async setItemsContentType(
    listName: string,
    listContentTypeId: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    const list = this._projectWeb.lists.getByTitle(listName)
    const items = await list.items.select('Id', 'ContentTypeId')<
      { Id: number; ContentTypeId: string }[]
    >()
    for (const item of items) {
      await list.items.getById(item.Id).update({
        ...properties,
        ContentTypeId: listContentTypeId
      })
    }
  }

  /**
   * Adds the content type to the list, and returns the ID of the list's own copy of it. A new
   * list loses the default content type of its template, so the items get this one.
   *
   * @param list List
   * @param contentTypeId Content type ID on the site
   * @param removeOthers Whether to remove the list's other content types
   */
  private async _bindContentType(
    list: IList,
    contentTypeId: string,
    removeOthers: boolean
  ): Promise<string> {
    await list.update({ ContentTypesEnabled: true })
    const isOwn = (id: string) => isListContentTypeOf(id, contentTypeId)
    const getIds = async () =>
      (await list.contentTypes.select('StringId')<{ StringId: string }[]>()).map(
        ({ StringId }) => StringId
      )
    let ids = await getIds()
    if (!ids.some(isOwn)) {
      await list.contentTypes.addAvailableContentType(contentTypeId)
      ids = await getIds()
    }
    const listContentTypeId = ids.find(isOwn)
    if (removeOthers) {
      // Folders keep their content type.
      for (const id of ids.filter((id) => !isOwn(id) && !id.startsWith('0x0120'))) {
        try {
          await list.contentTypes.getById(id).delete()
        } catch (error) {
          Logger.write(
            `(ShieldedProjectService) (_bindContentType) Could not remove content type ${id}: ${failureText(error)}`,
            LogLevel.Warning
          )
        }
      }
    }
    return listContentTypeId
  }

  /**
   * Adds the fields of the hub content type to the list and to the list's copy of the content
   * type. A field that is a site field on the project site is added from there; any other from its
   * schema on the hub, as `PortalDataService.syncList` does for the project properties.
   *
   * @param listName Title of the list
   * @param contentTypeId Content type ID
   * @param listContentTypeId The list's own copy of the content type
   * @param progressFunc Progress function
   */
  private async _ensureFields(
    listName: string,
    contentTypeId: string,
    listContentTypeId: string,
    progressFunc?: (progress: string) => void
  ): Promise<void> {
    const [hubContentType, siteFields, listFields, { jsomContext }] = await Promise.all([
      this._hubWeb.contentTypes
        .getById(contentTypeId)
        .select('Fields/InternalName', 'Fields/Title', 'Fields/SchemaXml')
        .expand('Fields')<ISPContentType>(),
      this._projectWeb.fields.select('InternalName')<{ InternalName: string }[]>(),
      this._projectWeb.lists.getByTitle(listName).fields.select('InternalName')<
        { InternalName: string }[]
      >(),
      initJsom(this._projectUrl, { loadTaxonomy: true })
    ])
    const spList = jsomContext.web.get_lists().getByTitle(listName)
    const listContentType = spList.get_contentTypes().getById(listContentTypeId)
    const fieldLinks = listContentType.get_fieldLinks()
    jsomContext.clientContext.load(fieldLinks)
    await executeQuery(jsomContext)
    const linked = new Set<string>()
    const enumerator = fieldLinks.getEnumerator()
    while (enumerator.moveNext()) linked.add(enumerator.get_current().get_name())
    const inList = new Set(listFields.map(({ InternalName }) => InternalName))
    const onSite = new Set(siteFields.map(({ InternalName }) => InternalName))

    for (const field of hubContentType.Fields) {
      if (linked.has(field.InternalName)) continue
      try {
        progressFunc?.(field.Title)
        if (!inList.has(field.InternalName)) {
          await this._addListField(jsomContext, spList, field, onSite)
        }
        const link = new SP.FieldLinkCreationInformation()
        link.set_field(spList.get_fields().getByInternalNameOrTitle(field.InternalName))
        listContentType.get_fieldLinks().add(link)
        listContentType.update(false)
        await executeQuery(jsomContext)
      } catch (error) {
        Logger.write(
          `(ShieldedProjectService) (_ensureFields) Could not add the field [${field.InternalName}] to [${listName}]: ${failureText(error)}`,
          LogLevel.Warning
        )
      }
    }
  }

  /**
   * Adds the fields the hub list has outside its content type to the list: columns of the list
   * itself, which the list's content type does not get, as on the hub. The setup goes on without
   * them when the hub list's fields cannot be read, or one of them cannot be added; running it
   * again adds what is missing.
   *
   * @param listName Title of the list, on the hub and on the project site
   * @param progressFunc Progress function
   */
  private async _ensureListFields(
    listName: string,
    progressFunc?: (progress: string) => void
  ): Promise<void> {
    try {
      const [hubFields, siteFields, listFields, { jsomContext }] = await Promise.all([
        this._hubWeb.lists
          .getByTitle(listName)
          .fields.filter('Hidden eq false and FromBaseType eq false')
          .select('InternalName', 'Title', 'SchemaXml', 'TypeAsString')<IListFieldSchema[]>(),
        this._projectWeb.fields.select('InternalName')<{ InternalName: string }[]>(),
        this._projectWeb.lists.getByTitle(listName).fields.select('InternalName')<
          { InternalName: string }[]
        >(),
        initJsom(this._projectUrl, { loadTaxonomy: true })
      ])
      const spList = jsomContext.web.get_lists().getByTitle(listName)
      const onSite = new Set(siteFields.map(({ InternalName }) => InternalName))
      const inList = listFields.map(({ InternalName }) => InternalName)
      for (const field of getMissingListFields(hubFields, inList)) {
        try {
          progressFunc?.(field.Title)
          await this._addListField(jsomContext, spList, field, onSite)
        } catch (error) {
          Logger.write(
            `(ShieldedProjectService) (_ensureListFields) Could not add the field [${field.InternalName}] to [${listName}]: ${failureText(error)}`,
            LogLevel.Warning
          )
        }
      }
    } catch (error) {
      Logger.write(
        `(ShieldedProjectService) (_ensureListFields) Could not read the fields of [${listName}] on the hub, so its own columns are not added to the project site's list: ${failureText(error)}`,
        LogLevel.Warning
      )
    }
  }

  /**
   * Adds a hub field to the list: the project site's own site field where it has one of that
   * name, else a field made from the hub field's schema, with its title.
   *
   * @param jsomContext The project site's JSOM context
   * @param spList The list
   * @param field The field on the hub
   * @param siteFieldNames Internal names of the project site's site fields
   */
  private async _addListField(
    jsomContext: JsomContext,
    spList: SP.List,
    field: Pick<IListFieldSchema, 'SchemaXml'> & { InternalName?: string; Title?: string },
    siteFieldNames: Set<string>
  ): Promise<void> {
    if (siteFieldNames.has(field.InternalName)) {
      spList
        .get_fields()
        .add(jsomContext.web.get_fields().getByInternalNameOrTitle(field.InternalName))
    } else {
      const created = spList
        .get_fields()
        .addFieldAsXml(
          transformFieldXml(field.SchemaXml, { DisplayName: field.InternalName }),
          false,
          SP.AddFieldOptions.addFieldInternalNameHint
        )
      created.set_title(field.Title)
      created.update()
    }
    await executeQuery(jsomContext)
  }
}
