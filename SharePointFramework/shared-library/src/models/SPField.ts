/**
 * SPField class.
 *
 * Initialized properties will be used to decide what
 * properties to fetch for the field.
 */
export class SPField {
  public Id?: string = '00000000-0000-0000-0000-000000000000'
  public TextField?: string = ''
  public InternalName?: string = ''
  public Title?: string = ''
  public Description?: string = ''
  public SchemaXml: string = '<Field></Field>'
  public TypeAsString?: string = 'Text'
  public Group?: string = ''
  public Hidden?: boolean = false
  public Choices?: string[] = []
  public TermSetId?: string = '00000000-0000-0000-0000-000000000000'
  public ShowInEditForm?: boolean
  public ShowInNewForm?: boolean
  public ShowInDisplayForm?: boolean
}
