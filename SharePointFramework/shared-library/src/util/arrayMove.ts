/**
 * Moves an element in the array to a new index.
 *
 * @param arr Array to be moved
 * @param old_index Old index of the array
 * @param new_index New index of the array
 */
export function arrayMove(arr: any[], old_index: number, new_index: number) {
  const _arr = [...arr]
  if (new_index >= _arr.length) {
    let k = new_index - _arr.length + 1
    while (k--) {
      _arr.push(undefined)
    }
  }
  _arr.splice(new_index, 0, _arr.splice(old_index, 1)[0])
  return _arr
}
