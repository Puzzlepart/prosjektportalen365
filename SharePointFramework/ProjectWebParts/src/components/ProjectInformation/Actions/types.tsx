export type ActionType = [
  string,
  string | (() => void),
  string,
  boolean?,
  boolean?
]
