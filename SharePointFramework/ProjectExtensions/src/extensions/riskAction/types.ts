import { PlannerExternalReferences } from '@microsoft/microsoft-graph-types'
import { IFieldCustomizerCellEventParameters } from '@microsoft/sp-listview-extensibility'
import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectExtensionsStrings'
import _ from 'lodash'
import { DataAdapter } from './dataAdapter'

/**
 * Represents the context object passed to the field customizer for a risk action item.
 */
export class RiskActionItemContext {
  /**
   * The ID of the risk action item.
   */
  public id: number

  /**
   * The title of the risk action item.
   */
  public title: string

  /**
   * The value of the field associated with the risk action item.
   */
  public fieldValue: string

  /**
   * The hidden values of the field associated with the risk action item.
   */
  public hiddenFieldValues: RiskActionHiddenFieldValues

  /**
   * Represents a RiskAction object.
   *
   * @constructor
   *
   * @param _event - The `IFieldCustomizerCellEventParameters` object
   * @param _pageContext - The `PageContext` object
   * @param hiddenFieldValues - The Map object containing hidden field values.
   */
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
   * Updates the current RiskActionItemContext with the provided tasks.
   *
   * @param tasks An array of RiskActionPlannerTaskReference objects to update the context with.
   *
   * @returns The updated RiskActionItemContext object.
   */
  public update(tasks: RiskActionPlannerTaskReference[]): RiskActionItemContext {
    const newContext = new RiskActionItemContext(this._event, this._pageContext)
    newContext.fieldValue = tasks.map((task) => task.title).join('\n')
    newContext.hiddenFieldValues = {
      ...this.hiddenFieldValues,
      data: RiskActionPlannerTaskReference.toString(tasks),
      tasks
    }
    return newContext
  }

  /**
   * Encodes the provided `url` to be used as a reference in a Planner task.
   *
   * @param url URL to encode
   */
  private _encodeUrl(url: string): string {
    return url.split('%').join('%25').split('.').join('%2E').split(':').join('%3A')
  }

  /**
   * Creates a new instance of the RiskActionItemContext class.
   *
   * @param event - The field customizer cell event parameters.
   * @param pageContext - The SharePoint page context.
   * @param hiddenFieldValues - The hidden field values.
   *
   * @returns A new instance of the RiskActionItemContext class.
   */
  public static create(
    event: IFieldCustomizerCellEventParameters,
    pageContext: PageContext,
    hiddenFieldValues: Map<string, any>
  ): RiskActionItemContext {
    return new RiskActionItemContext(event, pageContext, hiddenFieldValues)
  }
}

// {
//   "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#planner/tasks(details())/$entity",
//   "@odata.etag": "W/\"JzEtVGFzayAgQEBAQEBAQEBAQEBAQEBBQCc=\"",
//   "planId": "J6oYRz7XGUyKps_eudQNz5cAH4hR",
//   "bucketId": "mWL1odn0ikSrCkg3RRYjNpcABYtg",
//   "title": "Tittel A",
//   "orderHint": "8585009468505622626",
//   "assigneePriority": "8585009455399994461",
//   "percentComplete": 50,
//   "hasDescription": true,
//   "previewType": "checklist",
//   "completedDateTime": null,
//   "completedBy": null,
//   "referenceCount": 1,
//   "checklistItemCount": 4,
//   "activeChecklistItemCount": 4,
//   "conversationThreadId": null,
//   "priority": 1,
//   "id": "DdMPbaN8m0uFUbrdz0WsjJcACwWe",
//   "createdBy": {
//       "user": {
//           "displayName": null,
//           "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//       },
//       "application": {
//           "displayName": null,
//           "id": "857a1b3f-91be-44f3-a50f-9b19bc59be2b"
//       }
//   },
//   "appliedCategories": {
//       "category2": true
//   },
//   "assignments": {
//       "12c52351-57f2-4cd3-8549-8bc8a61e0f7b": {
//           "@odata.type": "#microsoft.graph.plannerAssignment",
//           "assignedDateTime": "2023-11-22T13:55:45.4781346Z",
//           "orderHint": "8585009456000150712P}",
//           "assignedBy": {
//               "user": {
//                   "displayName": null,
//                   "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//               },
//               "application": {
//                   "displayName": null,
//                   "id": "09abbdfd-ed23-44ee-a2d9-a627aa1c90f3"
//               }
//           }
//       }
//   },
//   "details@odata.context": "https://graph.microsoft.com/v1.0/$metadata#planner/tasks('DdMPbaN8m0uFUbrdz0WsjJcACwWe')/details/$entity",
//   "details": {
//       "@odata.etag": "W/\"JzEtVGFza0RldGFpbHMgQEBAQEBAQEBAQEBAQEBAZCc=\"",
//       "description": "\r\nEn lang beskrivelse. Eller ikke?\r\n",
//       "previewType": "checklist",
//       "id": "DdMPbaN8m0uFUbrdz0WsjJcACwWe",
//       "references": {
//           "https%3A//puzzlepart%2Esharepoint%2Ecom/sites/aaskollenungdomsskolemedflerbrukshall/Lists/Usikkerhet/DispForm%2Easpx?ID=4": {
//               "@odata.type": "#microsoft.graph.plannerExternalReference",
//               "alias": "D",
//               "type": null,
//               "previewPriority": "8585009468501768889",
//               "lastModifiedDateTime": "2023-11-22T13:33:55.3006918Z",
//               "lastModifiedBy": {
//                   "user": {
//                       "displayName": null,
//                       "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//                   }
//               }
//           }
//       },
//       "checklist": {
//           "40896": {
//               "@odata.type": "#microsoft.graph.plannerChecklistItem",
//               "isChecked": false,
//               "title": "Sjekkpunkt 1",
//               "orderHint": "8585009456339654779P0",
//               "lastModifiedDateTime": "2023-11-22T13:55:16.5395799Z",
//               "lastModifiedBy": {
//                   "user": {
//                       "displayName": null,
//                       "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//                   }
//               }
//           },
//           "49576": {
//               "@odata.type": "#microsoft.graph.plannerChecklistItem",
//               "isChecked": false,
//               "title": "Sjekkpunkt 2",
//               "orderHint": "8585009455ZW",
//               "lastModifiedDateTime": "2023-11-22T13:55:21.6557577Z",
//               "lastModifiedBy": {
//                   "user": {
//                       "displayName": null,
//                       "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//                   }
//               }
//           },
//           "54531": {
//               "@odata.type": "#microsoft.graph.plannerChecklistItem",
//               "isChecked": false,
//               "title": "Sjekkpunkt 3",
//               "orderHint": "8585009455H{",
//               "lastModifiedDateTime": "2023-11-22T13:55:23.8277032Z",
//               "lastModifiedBy": {
//                   "user": {
//                       "displayName": null,
//                       "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//                   }
//               }
//           },
//           "98552": {
//               "@odata.type": "#microsoft.graph.plannerChecklistItem",
//               "isChecked": false,
//               "title": "Sjekkpunkt 4",
//               "orderHint": "8585009455>b",
//               "lastModifiedDateTime": "2023-11-22T13:55:26.3181689Z",
//               "lastModifiedBy": {
//                   "user": {
//                       "displayName": null,
//                       "id": "12c52351-57f2-4cd3-8549-8bc8a61e0f7b"
//                   }
//               }
//           }
//       }
//   }
// }

export class RiskActionPlannerTask {
  public description: string
  public startDateTime: Date
  public dueDateTime: Date
  public assignees: { displayName: string; mail: string }[] = []
  public progress: string

  /**
   * Parses a value (the value returned from the Graph API) and
   * returns a `RiskActionPlannerTask` object.
   *
   * @param value The value to parse.
   * @param getUserInfo The function to call to get user info for the assignees.
   */
  public static async parse(
    value: any,
    getUserInfo: DataAdapter['_getUserInfo']
  ): Promise<RiskActionPlannerTask> {
    const task = new RiskActionPlannerTask()
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

export class RiskActionPlannerTaskReference {
  public id: string
  public title: string
  public isCompleted: string

  /**
   * Parses a string value and returns an array of `RiskActionPlannerTaskReference` objects.
   *
   * @param value - The string value to parse.
   *
   * @returns An array of `RiskActionPlannerTaskReference` objects.
   */
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

  /**
   * Returns a string representation of an array of `RiskActionPlannerTaskReference` objects.
   *
   * @param value - The array of `RiskActionPlannerTaskReference` objects to convert to a string.
   *
   * @returns A string representation of the array of `RiskActionPlannerTaskReference` objects.
   */
  public static toString(value: RiskActionPlannerTaskReference[]): string {
    return value
      .map((task) => `${task.id},${encodeURIComponent(task.title)},${task.isCompleted}`)
      .join('|')
  }
}

export type RiskActionHiddenFieldValues = {
  data: string
  tasks: RiskActionPlannerTaskReference[]
  updated: Date | string
}
