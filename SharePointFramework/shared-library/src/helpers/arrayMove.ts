/**
 * Moves an element in the array to a new index.
 * 
 * @param arr Array to be moved
 * @param old_index Old index of the array
 * @param new_index New index of the array
 * @returns 
 */
export function arrayMove(arr: any[], old_index: number, new_index: number) {
    while (old_index < 0) {
        old_index += arr.length
    }
    while (new_index < 0) {
        new_index += arr.length
    }
    if (new_index >= arr.length) {
        let k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
    return arr 
}