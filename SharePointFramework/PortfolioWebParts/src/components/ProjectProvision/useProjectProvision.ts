/* eslint-disable prefer-spread */
import { useProjectProvisionState } from './useProjectProvisionState'
import { useProjectProvisionDataFetch } from './useProjectProvisionDataFetch'
import { IProjectProvisionProps } from './types'
import { useModel } from 'pp365-shared-library/lib/components/CustomEditPanel/useModel'

/**
 * Component logic hook for `ProjectProvision`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 *
 * @param props Props
 */
export const useProjectProvision = (props: IProjectProvisionProps) => {
  const { state, setState } = useProjectProvisionState(props)

  useProjectProvisionDataFetch(props, setState)

  return {
    state,
    setState
  }
}
