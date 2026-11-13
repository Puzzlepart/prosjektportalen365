import { Choice } from 'models'
import { TELEMETRY_EVENTS } from 'pp365-shared-library/lib/telemetry'
import { ideaChoiceVariant } from './ideaChoiceVariant'

describe('ideaChoiceVariant', () => {
  it.each([
    [Choice.Approve, 'approve'],
    [Choice.Consideration, 'consider'],
    [Choice.Reject, 'reject'],
    // A choice the customer has added to the idea configuration, under a key of its own.
    ['pilot', 'other'],
    // The texts a dialog shows are no keys, in any language.
    ['Godkjenn', 'other'],
    ['Approve', 'other'],
    ['constructor', 'other'],
    [undefined, 'other']
  ])('counts the choice with the key %s as %s', (key, variant) => {
    expect(ideaChoiceVariant(key)).toBe(variant)
  })

  it('gives only variants the contract has for both idea events', () => {
    const keys = [Choice.Approve, Choice.Consideration, Choice.Reject, 'pilot']
    for (const event of ['idea.recommended', 'idea.decided'] as const) {
      const variants: readonly string[] = TELEMETRY_EVENTS[event].variants
      expect(keys.map((key) => ideaChoiceVariant(key)).sort()).toEqual([...variants].sort())
    }
  })
})
