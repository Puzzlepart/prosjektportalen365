/**
 * A term as the term search returns it and the tag fields exchange it.
 *
 * Replaces `ITag` from Fluent UI v8, which was never used as component props here: it was the
 * shape the data adapter's term search returned and the idea fields rendered.
 */
export interface ITagItem {
  key: string

  name: string
}
