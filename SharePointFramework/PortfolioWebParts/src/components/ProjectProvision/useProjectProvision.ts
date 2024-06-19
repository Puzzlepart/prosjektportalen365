/* eslint-disable prefer-spread */
import { useProjectProvisionState } from './useProjectProvisionState'
import { useProjectProvisionDataFetch } from './useProjectProvisionDataFetch'
import { IProjectProvisionProps } from './types'
import { useEditableColumn } from './useEditableColumn'

/**
 * Component logic hook for `ProjectProvision`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 *
 * @param props Props
 */
export const useProjectProvision = (props: IProjectProvisionProps) => {
  const { state, setState } = useProjectProvisionState()
  const { column, setColumn } = useEditableColumn(props, state, setState)

  useProjectProvisionDataFetch(props, setState)

  return {
    state,
    setState,
    column,
    setColumn
  }
}
