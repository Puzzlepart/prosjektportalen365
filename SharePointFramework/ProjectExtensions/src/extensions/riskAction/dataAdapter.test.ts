// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only lets `graphfi()` hand out `graph`, a
// stand-in for Microsoft Graph's Planner that answers a turn of the event loop later, as Graph
// does, and `spfi()` hand out `sp`, the risk list. `planner` and `list` record what they hold and
// what was written to them. The adapter's base class is a stand-in too: the test sets the global
// settings.
interface IFakeTask {
  id: string
  title: string
  planId: string
  bucketId: string
  percentComplete?: number
}

/** What PnPjs 4 fails with when Graph refuses a request: Graph's error body after `::>`. */
const graphError = (message: string) =>
  new Error(
    `Error making HttpClient request in queryable [403] Forbidden ::> ${JSON.stringify({
      error: { code: 'Forbidden', message }
    })}`
  )

const planner = {
  buckets: [] as Array<{ id: string; name: string; planId: string }>,
  addedBuckets: [] as string[],
  tasks: [] as IFakeTask[],
  taskUpdates: [] as any[],
  detailUpdates: [] as any[],
  failBuckets: false,
  /** The titles of the tasks Planner refuses, and what it refuses them with */
  refusedTitles: [] as string[],
  refusal: graphError('Du har ikke tilgang til planen.')
}
const list = {
  items: [] as any[],
  failItems: false,
  itemUpdates: [] as Array<[number, Record<string, any>]>,
  fields: [] as string[],
  addedFields: [] as string[]
}

/** Answers with `value()` a turn of the event loop later, or fails with what it throws. */
function later<T>(value: () => T): Promise<T> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(value())
      } catch (error) {
        reject(error)
      }
    }, 0)
  )
}

const graph = {
  users: {
    filter: () => () => later(() => [{ id: 'user-1' }]),
    getById: () => ({
      select: () => ({
        using: () => () => later(() => ({ displayName: 'Kari Nordmann', mail: 'kari@contoso.no' }))
      })
    })
  },
  groups: { getById: () => ({ plans: () => later(() => [{ id: 'plan-1' }]) }) },
  planner: {
    plans: {
      getById: (planId: string) => ({
        // The buckets as they are when Graph is asked, not when it answers.
        buckets: () => {
          const buckets = planner.buckets.filter((bucket) => bucket.planId === planId)
          return later(() => {
            if (planner.failBuckets) throw new Error('Planner svarte ikke')
            return buckets
          })
        }
      })
    },
    buckets: {
      add: ({ name, planId }: { name: string; planId: string }) =>
        later(() => {
          const bucket = { id: `bucket-${planner.buckets.length + 1}`, name, planId }
          planner.buckets.push(bucket)
          planner.addedBuckets.push(name)
          return bucket
        })
    },
    tasks: {
      add: ({ planId, title, bucketId }: { planId: string; title: string; bucketId: string }) =>
        later(() => {
          if (planner.refusedTitles.includes(title)) throw planner.refusal
          const task = { id: `task-${planner.tasks.length + 1}`, title, planId, bucketId }
          planner.tasks.push(task)
          return { ...task, '@odata.etag': 'W/"1"' }
        }),
      top: () => ({
        filter: () => ({ select: () => () => later(() => planner.tasks) })
      }),
      getById: (id: string) => ({
        update: (properties: any, eTag: string) => {
          planner.taskUpdates.push({ id, properties, eTag })
          return Promise.resolve()
        },
        details: Object.assign(() => Promise.resolve({ '@odata.etag': 'W/"2"' }), {
          update: (properties: any, eTag: string) => {
            planner.detailUpdates.push({ id, properties, eTag })
            return Promise.resolve()
          }
        }),
        expand: () => ({
          using: () => () =>
            later(() => ({
              id,
              planId: 'plan-1',
              percentComplete: 50,
              startDateTime: '2026-11-10T00:00:00Z',
              assignments: { 'user-1': {} },
              details: { description: '\r\nRing leverandørene\r\n' }
            }))
        })
      })
    }
  }
}

const sp = {
  web: {
    lists: {
      getById: () => ({
        items: {
          select: () => () =>
            later(() => {
              if (list.failItems) throw new Error('Listen finnes ikke')
              return list.items
            }),
          getById: (id: number) => ({
            update: (properties: Record<string, any>) => {
              list.itemUpdates.push([id, properties])
              return Promise.resolve()
            }
          })
        },
        fields: {
          filter: () => () => later(() => list.fields.map((InternalName) => ({ InternalName }))),
          addMultilineText: (name: string) => {
            list.addedFields.push(name)
            return Promise.resolve()
          },
          addDateTime: (name: string) => {
            list.addedFields.push(name)
            return Promise.resolve()
          }
        }
      })
    }
  }
}
jest.mock('@pnp/graph', () => {
  const stub = jest.requireActual('@pnp/graph')
  const overrides: Record<string | symbol, any> = {
    graphfi: () => ({ using: () => graph }),
    spfi: () => ({ using: () => sp })
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop in overrides ? overrides[prop] : target[prop])
  })
})
jest.mock('pp365-shared-library', () => ({
  DefaultCaching: {},
  SPDataAdapterBase: class {
    public globalSettings = new Map<string, string>()
  }
}))

import strings from 'ProjectExtensionsStrings'
import { DataAdapter } from './dataAdapter'
import { RiskActionItemContext } from './types'

/** The risk the tasks are made for, with what `addTask` reads of it. */
const RISK = { id: 7, references: {} } as any

/** The adapter of the risk list on a project whose bucket for risk actions is «Tiltak». */
function dataAdapter() {
  const adapter = new DataAdapter({
    pageContext: {
      list: { id: { toString: () => 'list-1' } },
      legacyPageContext: { groupId: 'group-1' }
    }
  } as any)
  adapter.globalSettings = new Map([['RiskActionPlannerBucketName', 'Tiltak']])
  return adapter
}

/**
 * The risk with `ID` 7 as the customizer reads it, with its tasks in Planner and its action field,
 * by default the tasks' titles.
 */
function riskWithTasks(
  tasks: Array<{ id: string; title: string; isCompleted: string }>,
  fieldValue = tasks.map(({ title }) => title).join('\n')
) {
  const values: Record<string, unknown> = { ID: 7, Title: 'Leverandøren går konkurs' }
  return RiskActionItemContext.create(
    {
      fieldValue,
      listItem: { getValueByName: (name: string) => values[name] }
    } as any,
    { list: { serverRelativeUrl: '/sites/frisbee/Lists/Usikkerhet' } } as any,
    new Map([['7', { data: '', tasks, updated: '' }]])
  )
}

beforeEach(() => {
  planner.buckets = []
  planner.addedBuckets = []
  planner.tasks = []
  planner.taskUpdates = []
  planner.detailUpdates = []
  planner.failBuckets = false
  planner.refusedTitles = []
  planner.refusal = graphError('Du har ikke tilgang til planen.')
  list.items = []
  list.failItems = false
  list.itemUpdates = []
  list.fields = []
  list.addedFields = []
})

describe('DataAdapter (risk actions in Planner)', () => {
  it('adds the bucket once when the actions of a risk are migrated together, and puts every task in it', async () => {
    const { added, refused } = await dataAdapter().addTasks(
      ['Finn en reserveleverandør', 'Inngå rammeavtale', 'Følg opp leveransene'],
      RISK
    )
    expect(planner.addedBuckets).toEqual(['Tiltak'])
    expect(added.map(({ title }) => title)).toEqual([
      'Finn en reserveleverandør',
      'Inngå rammeavtale',
      'Følg opp leveransene'
    ])
    expect(refused).toEqual([])
    expect(planner.tasks.map(({ bucketId }) => bucketId)).toEqual([
      'bucket-1',
      'bucket-1',
      'bucket-1'
    ])
  })

  it('adds the bucket once when tasks are added at the same time, each on its own', async () => {
    const adapter = dataAdapter()
    await Promise.all(
      ['Finn en reserveleverandør', 'Inngå rammeavtale', 'Følg opp leveransene'].map((title) =>
        adapter.addTask(new Map([['title', title]]), RISK)
      )
    )
    expect(planner.addedBuckets).toEqual(['Tiltak'])
    expect(planner.tasks.map(({ bucketId }) => bucketId)).toEqual([
      'bucket-1',
      'bucket-1',
      'bucket-1'
    ])
  })

  it('puts the tasks in the bucket the plan has, without adding one', async () => {
    planner.buckets = [{ id: 'bucket-9', name: 'Tiltak', planId: 'plan-1' }]
    await dataAdapter().addTasks(['Finn en reserveleverandør', 'Inngå rammeavtale'], RISK)
    expect(planner.addedBuckets).toEqual([])
    expect(planner.tasks.map(({ bucketId }) => bucketId)).toEqual(['bucket-9', 'bucket-9'])
  })

  it('fails the migration when the bucket cannot be looked up, and looks again the next time', async () => {
    const adapter = dataAdapter()
    planner.failBuckets = true
    await expect(adapter.addTasks(['Finn en reserveleverandør'], RISK)).rejects.toThrow(
      'Planner svarte ikke'
    )
    expect(planner.tasks).toEqual([])
    planner.failBuckets = false
    await adapter.addTasks(['Finn en reserveleverandør'], RISK)
    expect(planner.addedBuckets).toEqual(['Tiltak'])
    expect(planner.tasks).toHaveLength(1)
  })

  it('adds a task with the one responsible, its dates, its description and the link to the risk', async () => {
    const task = await dataAdapter().addTask(
      new Map<string, any>([
        ['title', 'Inngå rammeavtale'],
        ['responsible', 'kari@contoso.no'],
        ['startDate', '2026-11-10'],
        ['dueDate', '2026-11-20'],
        ['description', 'Med to leverandører']
      ]),
      RISK
    )
    expect(task.title).toBe('Inngå rammeavtale')
    expect(planner.taskUpdates).toEqual([
      {
        id: 'task-1',
        properties: {
          assignments: {
            'user-1': { '@odata.type': 'microsoft.graph.plannerAssignment', orderHint: ' !' }
          },
          startDateTime: '2026-11-10',
          dueDateTime: '2026-11-20'
        },
        eTag: 'W/"1"'
      }
    ])
    expect(planner.detailUpdates).toEqual([
      {
        id: 'task-1',
        properties: {
          description: 'Med to leverandører',
          references: {},
          previewType: 'noPreview'
        },
        eTag: 'W/"2"'
      }
    ])
  })

  it('names each action Planner refuses with what Planner said, and adds the others', async () => {
    planner.refusedTitles = ['Inngå rammeavtale']
    const { added, refused } = await dataAdapter().addTasks(
      ['Finn en reserveleverandør', 'Inngå rammeavtale', 'Følg opp leveransene'],
      RISK
    )
    expect(added.map(({ title }) => title)).toEqual([
      'Finn en reserveleverandør',
      'Følg opp leveransene'
    ])
    expect(refused).toEqual([
      { title: 'Inngå rammeavtale', reason: 'Du har ikke tilgang til planen.' }
    ])
  })

  it('fails a task Planner refuses with what Planner said, for the new-action panel to show', async () => {
    planner.refusedTitles = ['Inngå rammeavtale']
    const task = new Map([['title', 'Inngå rammeavtale']])
    await expect(dataAdapter().addTask(task, RISK)).rejects.toMatchObject({
      message: 'Du har ikke tilgang til planen.'
    })
    // Not Graph's error body: the message as it is.
    planner.refusal = new Error('Nettverket svarte ikke')
    await expect(dataAdapter().addTask(task, RISK)).rejects.toMatchObject({
      message: 'Nettverket svarte ikke'
    })
  })

  it("keeps the actions Planner refused at the migration written after the tasks' titles, with no task stored for them", async () => {
    const updated = await dataAdapter().updateItem(
      [
        { id: 'task-1', title: 'Finn en reserveleverandør' },
        { id: 'task-2', title: 'Følg opp leveransene' }
      ],
      riskWithTasks([], 'Finn en reserveleverandør\nInngå rammeavtale\nFølg opp leveransene'),
      ['Inngå rammeavtale']
    )
    expect(updated.fieldValue).toBe(
      'Finn en reserveleverandør\nFølg opp leveransene\nInngå rammeavtale'
    )
    expect(list.itemUpdates).toEqual([
      [
        7,
        {
          GtRiskAction: 'Finn en reserveleverandør\nFølg opp leveransene\nInngå rammeavtale',
          RiskActionData:
            'task-1,Finn%20en%20reserveleverand%C3%B8r,0|task-2,F%C3%B8lg%20opp%20leveransene,0'
        }
      ]
    ])
  })

  it('keeps the text written besides the tasks when a task is added, until an action of it is a task', async () => {
    const risk = riskWithTasks(
      [{ id: 'task-1', title: 'Finn en reserveleverandør', isCompleted: '0' }],
      'Finn en reserveleverandør\nInngå rammeavtale'
    )
    const adapter = dataAdapter()
    expect(
      (await adapter.updateItem([{ id: 'task-2', title: 'Følg opp leveransene' }], risk)).fieldValue
    ).toBe('Finn en reserveleverandør\nFølg opp leveransene\nInngå rammeavtale')
    expect(
      (await adapter.updateItem([{ id: 'task-3', title: 'Inngå rammeavtale' }], risk)).fieldValue
    ).toBe('Finn en reserveleverandør\nInngå rammeavtale')
  })

  it('stores the new tasks after the ones the risk had', async () => {
    const risk = riskWithTasks([
      { id: 'task-1', title: 'Finn en reserveleverandør', isCompleted: '1' }
    ])
    const updated = await dataAdapter().updateItem(
      [{ id: 'task-2', title: 'Inngå rammeavtale' }],
      risk
    )
    expect(updated.fieldValue).toBe('Finn en reserveleverandør\nInngå rammeavtale')
    expect(list.itemUpdates).toEqual([
      [
        7,
        {
          GtRiskAction: 'Finn en reserveleverandør\nInngå rammeavtale',
          RiskActionData:
            'task-1,Finn%20en%20reserveleverand%C3%B8r,1|task-2,Inng%C3%A5%20rammeavtale,0'
        }
      ]
    ])
  })

  it('brings the titles and the completion of the tasks in from Planner, and drops the deleted ones', async () => {
    planner.tasks = [
      {
        id: 'task-1',
        title: 'Finn to reserveleverandører',
        planId: 'plan-1',
        bucketId: 'bucket-1',
        percentComplete: 100
      }
    ]
    planner.buckets = [{ id: 'bucket-1', name: 'Tiltak', planId: 'plan-1' }]
    const updated = await dataAdapter().syncTasks(
      riskWithTasks([
        { id: 'task-1', title: 'Finn en reserveleverandør', isCompleted: '0' },
        { id: 'task-2', title: 'Inngå rammeavtale', isCompleted: '0' }
      ])
    )
    expect(updated.hiddenFieldValues.tasks).toEqual([
      { id: 'task-1', title: 'Finn to reserveleverandører', isCompleted: '1' }
    ])
    expect(list.itemUpdates).toEqual([
      [
        7,
        {
          GtRiskAction: 'Finn to reserveleverandører',
          RiskActionData: 'task-1,Finn%20to%20reserveleverand%C3%B8rer,1',
          RiskActionUpdated: expect.any(Date)
        }
      ]
    ])
  })

  it('keeps, as it synchronises, the text written besides the tasks, such as an action Planner refused', async () => {
    planner.tasks = [
      {
        id: 'task-1',
        title: 'Finn to reserveleverandører',
        planId: 'plan-1',
        bucketId: 'bucket-1',
        percentComplete: 0
      }
    ]
    planner.buckets = [{ id: 'bucket-1', name: 'Tiltak', planId: 'plan-1' }]
    await dataAdapter().syncTasks(
      riskWithTasks(
        [{ id: 'task-1', title: 'Finn en reserveleverandør', isCompleted: '0' }],
        'Finn en reserveleverandør\nInngå rammeavtale'
      )
    )
    expect(list.itemUpdates[0][1].GtRiskAction).toBe(
      'Finn to reserveleverandører\nInngå rammeavtale'
    )
  })

  it('reads a task with its description, dates, progress and the people assigned', async () => {
    const task = await dataAdapter().getTask('task-1')
    expect(task.description).toBe('Ring leverandørene')
    expect(task.startDateTime).toEqual(new Date('2026-11-10T00:00:00Z'))
    expect(task.dueDateTime).toBeNull()
    expect(task.assignees).toEqual([{ displayName: 'Kari Nordmann', mail: 'kari@contoso.no' }])
    expect(task.progress).toBe(strings.PlannerTaskInProgress)
  })

  it('adds the hidden fields the list lacks, and none when it has both', async () => {
    await dataAdapter().ensureHiddenFields()
    expect(list.addedFields).toEqual(['RiskActionData', 'RiskActionUpdated'])
    list.addedFields = []
    list.fields = ['RiskActionData', 'RiskActionUpdated']
    await dataAdapter().ensureHiddenFields()
    expect(list.addedFields).toEqual([])
  })

  it('reads the tasks of each risk from the hidden fields, and none when the list cannot be read', async () => {
    list.items = [
      {
        Id: 7,
        RiskActionData: 'task-1,Finn%20en%20reserveleverand%C3%B8r,1',
        RiskActionUpdated: '2026-11-01'
      },
      { Id: 8, RiskActionData: null, RiskActionUpdated: null }
    ]
    const values = await dataAdapter().getHiddenFieldValues()
    expect(values.get('7').tasks).toEqual([
      { id: 'task-1', title: 'Finn en reserveleverandør', isCompleted: '1' }
    ])
    expect(values.get('8')).toEqual({ data: '', tasks: [], updated: null })
    list.failItems = true
    expect((await dataAdapter().getHiddenFieldValues()).size).toBe(0)
  })
})
