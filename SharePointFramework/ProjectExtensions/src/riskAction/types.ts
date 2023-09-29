export interface IRiskActionFieldCustomizerProperties {
  /**
   * The name of the bucket to use for the risk action planner tasks.
   */
  bucketName?: string
}

/**
 * Represents the context object passed to the field customizer for a risk action item.
 */
export interface IRiskActionFieldCustomizerItemContext {
  /**
   * The ID of the risk action item.
   */
  id: number

  /**
   * The title of the risk action item.
   */
  title: string

  /**
   * The URL of the risk action item.
   */
  url: string

  /**
   * The value of the field associated with the risk action item.
   */
  fieldValue: string

  /**
   * The hidden value of the field associated with the risk action item.
   */
  hiddenFieldValue: string
}