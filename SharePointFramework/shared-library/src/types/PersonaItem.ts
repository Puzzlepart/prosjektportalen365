/**
 * A person, as `clientPeoplePickerSearchUser` returns them and as the person fields exchange them
 * with their models.
 *
 * Replaces `IPersonaProps` from Fluent UI v8, which was never used as component props here: it was
 * the shape passed between the data adapter, the field value map, the edit panel's model and the
 * renderers. This declares the fields that are actually read rather than pulling in the full v8
 * persona surface.
 *
 * `secondaryText` is the email, and it is the identity: the save path resolves a person through
 * `ensureUser(secondaryText)`, and the search excludes people already picked by comparing it.
 */
export interface IPersonaItem {
  /**
   * The SharePoint user id, when the person came from a list item.
   */
  key?: string | number

  /**
   * The login name, when the person came from a people search.
   */
  id?: string

  /**
   * Display name.
   */
  text?: string

  /**
   * Email address, and the identity of the person. See the note above.
   */
  secondaryText?: string

  /**
   * Job title.
   */
  tertiaryText?: string

  /**
   * Department.
   */
  optionalText?: string

  /**
   * Profile photo URL.
   */
  imageUrl?: string
}
