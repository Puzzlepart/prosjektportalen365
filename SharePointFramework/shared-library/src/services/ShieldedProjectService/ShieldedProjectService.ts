import { Logger, LogLevel } from '@pnp/logging'
import { IList } from '@pnp/sp/lists'
import '@pnp/sp/presets/all'
import { IWeb } from '@pnp/sp/webs'
import strings from 'SharedLibraryStrings'
import initJsom, { ExecuteJsomQuery as executeQuery, JsomContext } from 'spfx-jsom'
import { ISPContentType } from '../../interfaces'
import { format, transformFieldXml } from '../../util'
import { getContentTypeLineage, isListContentTypeOf } from './contentTypeLineage'
import {
  getFieldLinkChanges,
  getListContentTypeFieldNames,
  getListOwnFields,
  getSiteColumnSchema,
  IFieldLinkSettings,
  IListContentTypeLinks,
  IListFieldSchema
} from './listFields'
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

/** A hub field, as much of it as it takes to give a list on the project site the same field. */
type HubField = Pick<IListFieldSchema, 'InternalName' | 'Title' | 'SchemaXml'>

/** A site column of the hub, as much of it as it takes to make the project site the same one. */
type HubSiteColumn = Pick<IListFieldSchema, 'InternalName' | 'SchemaXml'>

/**
 * What a field's schema says of the list it was read from, beside what `transformFieldXml` takes
 * out by itself. A site column made from the schema has none of it.
 */
const LIST_FIELD_ATTRIBUTES = [
  'Version',
  'SourceID',
  'Required',
  'WebId',
  'List',
  'ColName',
  'ColName2',
  'RowOrdinal',
  'RowOrdinal2'
]

/**
 * Sets up the lists a shielded project keeps its project data in, on its own site: the lists have
 * the titles of the hub lists they replace, and their items the hub's content types, created on
 * the project site with the same IDs and fields. The portfolio's searches for those content
 * types then find the items, trimmed to who has access to the project. Every step can be run
 * again: what is there already is kept.
 */
export class ShieldedProjectService {
  /** The hub's site columns, read when the first site column is to be made (`_getHubSiteColumns`). */
  private _hubSiteColumns: Promise<HubSiteColumn[]>

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
        Hidden: params.hidden ?? true,
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
        !!params.includeHubListFields,
        params.progressFunc
      )
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
   * Gives the list the fields of the hub content type, and of what the hub list has given its own
   * copy of it, linked to the list's copy of the content type.
   *
   * A field is added from a site column of the project site, made from the hub's site column
   * where the site lacks one. Search gives the portfolio a list field's values (`…OWSTEXT` and
   * the like) only when the field was added from a site column: a column made on the list itself
   * is indexed without them.
   *
   * SharePoint links a field it adds to a list to the list's default content type by itself, and
   * a taxonomy field's hidden companions with it. The links are therefore read after the fields
   * are added, only the missing ones are made, and a link SharePoint refuses is warned of only
   * where the field is still not linked afterwards.
   *
   * Last, the list's copy of the content type is given what the hub's content type says of each
   * field: whether its forms hide it, and require it (`_applyFieldLinkSettings`).
   *
   * @param listName Title of the list
   * @param contentTypeId Content type ID
   * @param listContentTypeId The list's own copy of the content type
   * @param includeHubListFields Whether to take what the hub list has given its copy too
   * @param progressFunc Progress function
   */
  private async _ensureFields(
    listName: string,
    contentTypeId: string,
    listContentTypeId: string,
    includeHubListFields: boolean,
    progressFunc?: (progress: string) => void
  ): Promise<void> {
    const [hubContentType, siteFields, listFields, { jsomContext }] = await Promise.all([
      this._hubWeb.contentTypes
        .getById(contentTypeId)
        .select(
          'Fields/InternalName',
          'Fields/Title',
          'Fields/SchemaXml',
          'FieldLinks/Name',
          'FieldLinks/Hidden',
          'FieldLinks/Required'
        )
        .expand('Fields', 'FieldLinks')<ISPContentType>(),
      this._projectWeb.fields.select('InternalName')<{ InternalName: string }[]>(),
      this._projectWeb.lists.getByTitle(listName).fields.select('InternalName')<
        { InternalName: string }[]
      >(),
      initJsom(this._projectUrl, { loadTaxonomy: true })
    ])
    const fields: HubField[] = [
      ...hubContentType.Fields,
      ...(includeHubListFields
        ? await this._getHubListOwnFields(
            listName,
            contentTypeId,
            hubContentType.Fields.map(({ InternalName }) => InternalName)
          )
        : [])
    ]
    const spList = jsomContext.web.get_lists().getByTitle(listName)
    const onSite = new Set(siteFields.map(({ InternalName }) => InternalName))
    const inList = new Set(listFields.map(({ InternalName }) => InternalName))

    for (const field of fields) {
      if (inList.has(field.InternalName)) continue
      try {
        progressFunc?.(field.Title)
        await this._addListField(jsomContext, spList, field, onSite)
        inList.add(field.InternalName)
      } catch (error) {
        Logger.write(
          `(ShieldedProjectService) (_ensureFields) Could not add the field [${field.InternalName}] to [${listName}]: ${failureText(error)}`,
          LogLevel.Warning
        )
      }
    }

    const listContentType = spList.get_contentTypes().getById(listContentTypeId)
    let links = await this._loadFieldLinks(jsomContext, listContentType)
    const refused: { field: HubField; error: unknown }[] = []
    let linkedAny = false
    for (const field of fields) {
      if (links.has(field.InternalName) || !inList.has(field.InternalName)) continue
      try {
        progressFunc?.(field.Title)
        const link = new SP.FieldLinkCreationInformation()
        link.set_field(spList.get_fields().getByInternalNameOrTitle(field.InternalName))
        listContentType.get_fieldLinks().add(link)
        listContentType.update(false)
        await executeQuery(jsomContext)
        linkedAny = true
      } catch (error) {
        refused.push({ field, error })
      }
    }
    if (linkedAny || refused.length > 0) {
      links = await this._loadFieldLinks(jsomContext, listContentType)
    }
    for (const { field, error } of refused) {
      // Linked along with its taxonomy field, and refused a second link: nothing is missing.
      if (links.has(field.InternalName)) continue
      Logger.write(
        `(ShieldedProjectService) (_ensureFields) Could not give the content type of [${listName}] the field [${field.InternalName}]: ${failureText(error)}`,
        LogLevel.Warning
      )
    }
    await this._applyFieldLinkSettings(
      jsomContext,
      listName,
      listContentType,
      links,
      hubContentType.FieldLinks
    )
  }

  /**
   * The field links of a list's copy of a content type as they are now, by the name of the field.
   *
   * @param jsomContext The project site's JSOM context
   * @param listContentType The list's copy of the content type
   */
  private async _loadFieldLinks(
    jsomContext: JsomContext,
    listContentType: SP.ContentType
  ): Promise<Map<string, SP.FieldLink>> {
    const fieldLinks = listContentType.get_fieldLinks()
    jsomContext.clientContext.load(fieldLinks)
    await executeQuery(jsomContext)
    const links = new Map<string, SP.FieldLink>()
    const enumerator = fieldLinks.getEnumerator()
    while (enumerator.moveNext()) {
      const link = enumerator.get_current()
      links.set(link.get_name(), link)
    }
    return links
  }

  /**
   * Gives the list's copy of the content type what the hub's content type says of each field it
   * links: whether its forms hide the field, and whether an item must have a value in it. The
   * hub's status report content type hides the title and requires the status fields; a link made
   * on the project site says what the field itself does. The panel a status report is edited in
   * reads the list's copy (`PortalDataService.getStatusReportFields`), so without this it asked
   * for a title and let a report be saved without a status. The links that say the same already
   * are left alone, and the others are changed in one query.
   *
   * @param jsomContext The project site's JSOM context
   * @param listName Title of the list
   * @param listContentType The list's copy of the content type
   * @param links The field links of the list's copy, by the name of the field
   * @param hubLinks The field links of the hub's content type
   */
  private async _applyFieldLinkSettings(
    jsomContext: JsomContext,
    listName: string,
    listContentType: SP.ContentType,
    links: Map<string, SP.FieldLink>,
    hubLinks: IFieldLinkSettings[]
  ): Promise<void> {
    const changes = getFieldLinkChanges(
      hubLinks,
      Array.from(links.values()).map((link) => ({
        Name: link.get_name(),
        Hidden: link.get_hidden(),
        Required: link.get_required()
      }))
    )
    if (changes.length === 0) return
    try {
      for (const { Name, Hidden, Required } of changes) {
        const link = links.get(Name)
        link.set_hidden(Hidden)
        link.set_required(Required)
      }
      listContentType.update(false)
      await executeQuery(jsomContext)
    } catch (error) {
      Logger.write(
        `(ShieldedProjectService) (_applyFieldLinkSettings) Could not give the content type of [${listName}] what the hub's content type says of [${changes.map(({ Name }) => Name).join(', ')}], so its forms hide and require those fields as the fields themselves say: ${failureText(error)}`,
        LogLevel.Warning
      )
    }
  }

  /**
   * The hub's site columns, read once, when the first site column is to be made on the project
   * site. Where they cannot be read, a site column is made from the field as its content type or
   * list has it, and a warning says so.
   */
  private _getHubSiteColumns(): Promise<HubSiteColumn[]> {
    if (!this._hubSiteColumns) {
      this._hubSiteColumns = this._hubWeb.fields
        .select('InternalName', 'SchemaXml')<HubSiteColumn[]>()
        .catch((error): HubSiteColumn[] => {
          Logger.write(
            `(ShieldedProjectService) (_getHubSiteColumns) Could not read the hub's site columns, so a site column of the project site is made from the field as the hub's content type or list has it: ${failureText(error)}`,
            LogLevel.Warning
          )
          return []
        })
    }
    return this._hubSiteColumns
  }

  /**
   * The fields the hub list has given its own copy of the content type beyond the content type's
   * own: on the hub's list for status reports, the columns PP-assistenten writes its analysis of
   * a report to. The setup goes on without them when the hub list cannot be read; running it
   * again adds what is missing.
   *
   * @param listName Title of the list, on the hub and on the project site
   * @param contentTypeId Content type ID
   * @param contentTypeFieldNames Internal names of the content type's own fields
   */
  private async _getHubListOwnFields(
    listName: string,
    contentTypeId: string,
    contentTypeFieldNames: string[]
  ): Promise<IListFieldSchema[]> {
    try {
      const hubList = this._hubWeb.lists.getByTitle(listName)
      const [contentTypes, fields] = await Promise.all([
        hubList.contentTypes.select('StringId', 'FieldLinks/Name').expand('FieldLinks')<
          IListContentTypeLinks[]
        >(),
        hubList.fields
          .filter('Hidden eq false and FromBaseType eq false')
          .select('InternalName', 'Title', 'SchemaXml', 'TypeAsString')<IListFieldSchema[]>()
      ])
      return getListOwnFields(
        fields,
        getListContentTypeFieldNames(contentTypes, contentTypeId),
        contentTypeFieldNames
      )
    } catch (error) {
      Logger.write(
        `(ShieldedProjectService) (_getHubListOwnFields) Could not read what [${listName}] on the hub has given its content type, so the project site's list gets the content type's own fields only: ${failureText(error)}`,
        LogLevel.Warning
      )
      return []
    }
  }

  /**
   * Adds a hub field to the list from a site column of the project site: the site's own where it
   * has one of that name, else one made here from the hub's site column of that name, as the
   * setup's own step for site columns makes them. The hub field's own schema is what its content
   * type or list says of it, and is used only where the hub has no such site column. Where the
   * site column cannot be made, or the list will not take it, the list gets a column of its own
   * from the hub field's schema, as it did before, and a warning says what that costs.
   *
   * @param jsomContext The project site's JSOM context
   * @param spList The list
   * @param field The field on the hub
   * @param siteFieldNames Internal names of the project site's site columns, added to here
   */
  private async _addListField(
    jsomContext: JsomContext,
    spList: SP.List,
    field: HubField,
    siteFieldNames: Set<string>
  ): Promise<void> {
    try {
      if (!siteFieldNames.has(field.InternalName)) {
        await this._projectWeb.fields.createFieldAsXml(
          transformFieldXml(
            getSiteColumnSchema(field, await this._getHubSiteColumns()),
            {},
            LIST_FIELD_ATTRIBUTES
          )
        )
        siteFieldNames.add(field.InternalName)
      }
      spList
        .get_fields()
        .add(jsomContext.web.get_fields().getByInternalNameOrTitle(field.InternalName))
      await executeQuery(jsomContext)
      return
    } catch (error) {
      Logger.write(
        `(ShieldedProjectService) (_addListField) Could not add [${field.InternalName}] from a site column of the project site, so the list gets a column of its own, whose values search does not give the portfolio: ${failureText(error)}`,
        LogLevel.Warning
      )
    }
    const created = spList
      .get_fields()
      .addFieldAsXml(
        transformFieldXml(field.SchemaXml, { DisplayName: field.InternalName }),
        false,
        SP.AddFieldOptions.addFieldInternalNameHint
      )
    created.set_title(field.Title)
    created.update()
    await executeQuery(jsomContext)
  }
}
