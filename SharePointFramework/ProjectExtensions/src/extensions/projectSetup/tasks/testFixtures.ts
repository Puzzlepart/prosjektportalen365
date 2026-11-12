/**
 * Stand-ins for the tasks' tests: the `Logger` of `@pnp/logging` that the tasks share with
 * sp-js-provisioning, and the engine itself.
 */

/** A log line, as `Logger.log` takes it. */
interface ILine {
  message: string
  level: number
}

/**
 * Adds working log listeners and level filtering to the shared PnP stub.
 * All @pnp imports share that stub, so a proxy preserves its other exports.
 *
 * @param others Other values of the `@pnp/*` modules to replace
 */
export function fakeLogging(others: Record<string, any> = {}) {
  const stub = jest.requireActual('@pnp/logging')
  const listeners: Array<{ log: (line: ILine) => void }> = []
  const Logger = {
    activeLogLevel: 2,
    subscribe: (...added: Array<{ log: (line: ILine) => void }>) => listeners.push(...added),
    log: (line: ILine) => {
      if (line.level >= Logger.activeLogLevel) listeners.forEach((listener) => listener.log(line))
    },
    write: (message: string, level = 1) => Logger.log({ message, level })
  }
  const overrides: Record<string | symbol, any> = {
    ...others,
    Logger,
    FunctionListener: (log: (line: ILine) => void) => ({ log })
  }
  return new Proxy(stub, {
    get: (target, prop) => (prop in overrides ? overrides[prop] : target[prop])
  })
}

/** What the engine stand-in of {@link fakeEngine} was set up with and applied. */
export interface IEngineRecord {
  setups: any[]
  applied: any[]
  /** Lines every `applyTemplate` logs, after the schema's own (`[level, message]`) */
  log?: Array<[number, string]>
  /** Thrown by the next `applyTemplate`, with `handler` set to `Navigation` */
  fail?: Error
}

/**
 * Builds a provisioning-engine stand-in that records schemas, reports handlers and emits PnP logs.
 */
export function fakeEngine(record: IEngineRecord) {
  class WebProvisioner {
    public prefix = ''

    public setup(config: any) {
      record.setups.push(config)
      this.prefix = config?.logging?.prefix ?? ''
      return this
    }

    public applyTemplate(
      schema: any,
      _handlers: string[],
      progress?: (handler: string) => void
    ): Promise<void> {
      const { Logger } = jest.requireMock('@pnp/logging')
      record.applied.push(schema)
      Object.keys(schema).forEach((handler) => progress?.(handler))
      for (const [level, message] of [...(schema.log ?? []), ...(record.log ?? [])]) {
        Logger.log({ message: `${this.prefix} ${message}`, level })
      }
      return record.fail
        ? Promise.reject(Object.assign(record.fail, { handler: 'Navigation' }))
        : Promise.resolve()
    }
  }
  return { WebProvisioner }
}
