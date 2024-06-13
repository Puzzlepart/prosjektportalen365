/* eslint-disable prefer-spread */
import { useProjectProvisionState } from './useProjectProvisionState'
import { useProjectProvisionDataFetch } from './useProjectProvisionDataFetch'
import { IProjectProvisionProps } from './types'
import { useEditableColumn } from './useEditableColumn'
import { useId } from '@fluentui/react-components'

/**
 * Component logic hook for `ProjectProvision`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 *
 * @param props Props
 */
export const useProjectProvision = (props: IProjectProvisionProps) => {
  const { state, setState } = useProjectProvisionState()
  const { column, setColumn } = useEditableColumn(props, state, setState)

  useProjectProvisionDataFetch(props, state.refetch, setState)

  const toasterId = useId('toaster')
  const fluentProviderId = useId('fp-project-provision')

  return {
    state,
    setState,
    column,
    setColumn,
    toasterId,
    fluentProviderId
  }
}
