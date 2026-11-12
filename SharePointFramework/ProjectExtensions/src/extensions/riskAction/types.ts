import { PlannerExternalReferences, PlannerTask } from '@microsoft/microsoft-graph-types'
import { IFieldCustomizerCellEventParameters } from '@microsoft/sp-listview-extensibility'
import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectExtensionsStrings'
import _ from 'lodash'
import { DataAdapter } from './dataAdapter'

/**
 * Returns nonblank action lines not represented by the supplied Planner tasks.
 */
export function textBesidesTasks(fieldValue: string, tasks: Array<{ title: string }>): string[] {
  const titles = new Set(tasks.map(({ title }) => (title ?? '').trim()))
  return (fieldValue ?? '')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '' && !titles.has(line.trim()))
}

/** Risk-item values and Planner references used by the field customizer. */
export class RiskActionItemContext {
  public id: number

  public title: string

  public fieldValue: string

  public hiddenFieldValues: RiskActionHiddenFieldValues

  private constructor(
    private _event: IFieldCustomizerCellEventParameters,
    private _pageContext: PageContext,
    hiddenFieldValues: Map<string, any> = new Map<string, any>()
  ) {
    this.id = _event.listItem.getValueByName('ID')
    this.title = _event.listItem.getValueByName('Title').toString()
    this.fieldValue = _event.fieldValue
    this.hiddenFieldValues = hiddenFieldValues.get(this.id.toString())
  }

  /**
   * The reference to the risk action item used for the Planner tasks.
   */
  public get references(): PlannerExternalReferences {
    const url = `${window.location.protocol}//${window.location.host}${this._pageContext?.list?.serverRelativeUrl}/DispForm.aspx?ID=${this.id}`
    return {
      [this._encodeUrl(url)]: {
        '@odata.type': 'microsoft.graph.plannerExternalReference',
        alias: this.title
      }
    }
  }

  /**
   * Builds a new item context with task titles followed by any retained action text.
   *
   * @param keep Text retained after task titles. Defaults to unmatched lines if tasks already
   * exist, otherwise none: the first task replaces handwritten actions unless explicitly retained.
   */
  public update(
    tasks: RiskActionPlannerTaskReference[],
    keep: string[] = this._textBesides(tasks)
  ): RiskActionItemContext {
    const newContext = new RiskActionItemContext(this._event, this._pageContext)
    newContext.fieldValue = [...tasks.map((task) => task.title), ...keep].join('\n')
    newContext.hiddenFieldValues = {
      ...this.hiddenFieldValues,
      data: RiskActionPlannerTaskReference.toString(tasks),
      tasks
    }
    return newContext
  }

  /** Preserves non-task action text only when the risk already has Planner references. */
  private _textBesides(tasks: RiskActionPlannerTaskReference[]): string[] {
    const current = this.hiddenFieldValues?.tasks ?? []
    if (current.length === 0) return []
    return textBesidesTasks(this.fieldValue, [...current, ...tasks])
  }

  /** Escapes characters Planner disallows in external-reference keys. */
  private _encodeUrl(url: string): string {
    return url.split('%').join('%25').split('.').join('%2E').split(':').join('%3A')
  }

  /** Combines SPFx cell values with the item's previously loaded hidden Planner fields. */
  public static create(
    event: IFieldCustomizerCellEventParameters,
    pageContext: PageContext,
    hiddenFieldValues: Map<string, any>
  ): RiskActionItemContext {
    return new RiskActionItemContext(event, pageContext, hiddenFieldValues)
  }
}

/** Planner task details prepared for the risk-action preview. */
export class RiskActionPlannerTask {
  public description: string
  public startDateTime: Date
  public dueDateTime: Date
  public assignees: { displayName: string; mail: string }[] = []
  public progress: string
  public planId: string

  /**
   * Converts Graph task details to preview values, resolving assignees and localized progress.
   *
   * @param getUserInfo Resolves Graph user IDs to assignee display names and email addresses.
   */
  public static async parse(
    value: any,
    getUserInfo: DataAdapter['_getUserInfo']
  ): Promise<RiskActionPlannerTask> {
    const task = new RiskActionPlannerTask()
    task.planId = _.get(value, 'planId', '')
    task.description = _.get(value, 'details.description', '').trim()
    task.startDateTime = _.get(value, 'startDateTime')
      ? new Date(_.get(value, 'startDateTime'))
      : null
    task.dueDateTime = _.get(value, 'dueDateTime') ? new Date(_.get(value, 'dueDateTime')) : null
    const assignments = Object.keys(_.get(value, 'assignments', {}))
    for (let i = 0; i < assignments.length; i++) {
      const assignee = assignments[i]
      const assigneeDetails = await getUserInfo(assignee)
      task.assignees.push(assigneeDetails)
    }
    const percentComplete = _.get(value, 'percentComplete')
    const progressMap = new Map<number, string>([
      [0, strings.PlannerTaskNotStarted],
      [50, strings.PlannerTaskInProgress],
      [100, strings.PlannerTaskCompleted]
    ])
    task.progress = progressMap.get(percentComplete)
    return task
  }
}

/** Compact task reference serialized in the risk list's hidden data field. */
export class RiskActionPlannerTaskReference {
  public id: string
  public title: string
  public isCompleted: string

  /** Reads pipe-separated references, decoding each URL-encoded title. */
  public static fromString(value: string): RiskActionPlannerTaskReference[] {
    return (
      value
        .split('|')
        .filter(Boolean)
        .map((part: string) => part.split(','))
        .map<RiskActionPlannerTaskReference>(([id, title, isCompleted]) => ({
          id,
          title: decodeURIComponent(title),
          isCompleted
        })) ?? []
    )
  }

  /** Serializes references with URL-encoded titles to protect delimiter characters. */
  public static toString(value: RiskActionPlannerTaskReference[]): string {
    return value
      .map((task) => `${task.id},${encodeURIComponent(task.title)},${task.isCompleted}`)
      .join('|')
  }
}

/** Stored references, parsed tasks and the last synchronization timestamp for a risk. */
export type RiskActionHiddenFieldValues = {
  data: string
  tasks: RiskActionPlannerTaskReference[]
  updated: Date | string
}

/**
 * Batch task-creation results, preserving action order and Planner's refusal reasons.
 */
export type RiskActionTasksResult = {
  added: PlannerTask[]
  refused: Array<{ title: string; reason: string }>
}
