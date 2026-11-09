import ListLogger from './ListLogger'

/**
 * The list logger writes an entry to the log list it was initialized with, mapped to the list's
 * field names, and never lets a rejected write reach the caller: the project setup awaits its
 * entries, and a 403 from the portfolio site stopped the setup until the write was caught.
 */
describe('ListLogger', () => {
  const add = jest.fn()
  const list = { items: { add } }
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => {
    add.mockReset()
    warn.mockClear()
    ListLogger.init(list, 'https://contoso.sharepoint.com/sites/frisbee', 'ProjectSetup')
  })

  afterAll(() => warn.mockRestore())

  it('writes the entry to the list with its field names, and resolves to the created item', async () => {
    const created = { Id: 12, GtLogMessage: 'Provisioning the lists' }
    add.mockResolvedValue(created)
    await expect(
      ListLogger.log({
        message: 'Provisioning the lists',
        functionName: 'onInit',
        level: 'Warning'
      })
    ).resolves.toBe(created)
    expect(add).toHaveBeenCalledWith({
      GtLogWebUrl: 'https://contoso.sharepoint.com/sites/frisbee',
      GtLogScope: 'ProjectSetup',
      GtLogMessage: 'Provisioning the lists',
      GtLogFunctionName: 'onInit',
      GtLogLevel: 'Warning'
    })
  })

  it('resolves to undefined when the write is rejected, and reports the status and request id', async () => {
    const headers = new Map([['sprequestguid', 'c0ffee']])
    add.mockRejectedValue({ status: 403, message: 'Access denied', response: { headers } })
    await expect(ListLogger.write('Done', 'onComplete', 'Error')).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('Status: 403, SPRequestGuid: c0ffee')
    expect(warn.mock.calls[0][1]).toBe('Access denied')
  })

  it("`write` sends the message, the level and the function with the logger's scope", async () => {
    add.mockResolvedValue({ Id: 13 })
    await ListLogger.write('Done')
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        GtLogMessage: 'Done',
        GtLogLevel: 'Info',
        GtLogScope: 'ProjectSetup'
      })
    )
    expect(add.mock.calls[0][0]).not.toHaveProperty('GtLogFunctionName')
  })
})
