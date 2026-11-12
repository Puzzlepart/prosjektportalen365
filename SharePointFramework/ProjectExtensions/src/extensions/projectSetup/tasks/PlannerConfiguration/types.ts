import { stringIsNullOrEmpty } from '@pnp/core'

/** Plan identity and ownership used during setup. */
export interface IPlannerPlan {
  title: string
  id?: string
  owner?: string
}

/** Planner reference parsed from a semicolon-separated URL, alias and optional type. */
export class TaskAttachment {
  public url: string
  public alias: string
  public type: string

  constructor(str: string) {
    const [url, alias, type] = str.split(';')
    this.url = this._encodeUrl(url)
    this.alias = alias || url
    this.type = this._getType(url, type)
  }

  /** Uses an explicit reference type or infers it from the file extension. */
  private _getType(url: string, type: string) {
    if (!stringIsNullOrEmpty(type)) return type
    if (url.endsWith('ppt') || url.endsWith('pptx')) return 'PowerPoint'
    if (url.endsWith('xls') || url.endsWith('xlsx')) return 'Excel'
    if (url.endsWith('doc') || url.endsWith('docx')) return 'Word'
    if (url.endsWith('pdf')) return 'Pdf'
    return 'Other'
  }

  /**
   * Escapes characters Planner disallows in external-reference keys.
   *
   * @see https://docs.microsoft.com/en-gb/graph/api/resources/plannerexternalreferences?view=graph-rest-1.0
   */
  private _encodeUrl(url: string) {
    return url.split('%').join('%25').split('.').join('%2E').split(':').join('%3A')
  }
}

/** Preview modes accepted by Planner task details. */
export type TaskPreviewType = 'automatic' | 'noPreview' | 'checklist' | 'description' | 'reference'

/** Optional details applied after a Planner task is created. */
export interface ITaskDetails {
  name?: string
  description?: string
  checklist?: string[]
  labels?: string[]
  attachments?: TaskAttachment[]
  previewType?: TaskPreviewType
}

/** Task details indexed first by bucket name, then by task title. */
export interface IPlannerConfiguration {
  [key: string]: {
    [key: string]: ITaskDetails
  }
}

/** Bucket identity used to provision and deduplicate tasks. */
export interface IPlannerBucket {
  id: string
  name: string
  planId: string
}
