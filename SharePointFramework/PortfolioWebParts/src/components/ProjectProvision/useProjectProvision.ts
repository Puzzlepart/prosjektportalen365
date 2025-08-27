/* eslint-disable prefer-spread */
import { useProjectProvisionState } from './useProjectProvisionState'
import { useProjectProvisionDataFetch } from './useProjectProvisionDataFetch'
import { IProjectProvisionProps } from './types'
import { useEditableColumn } from './useEditableColumn'
import { useId } from '@fluentui/react-components'
import { useEffect, useState } from 'react'
import strings from 'PortfolioWebPartsStrings'

/**
 * Component logic hook for `ProjectProvision`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 *
 * @param props Props
 */
export const useProjectProvision = (props: IProjectProvisionProps) => {
  const { state, setState } = useProjectProvisionState()
  const [hasProjectProvisionAccess, setHasProjectProvisionAccess] = useState<boolean>(false)

  useProjectProvisionDataFetch(props, state.refetch, setState)

  const { column, setColumn, reset } = useEditableColumn(props, state, setState)

  const toasterId = useId('toaster')
  const fluentProviderId = useId('fp-project-provision')

  useEffect(() => {
    const checkProjectProvisionAccess = async () => {
      if (props.hasProjectProvisionAccess !== undefined) {
        setHasProjectProvisionAccess(props.hasProjectProvisionAccess)
      } else if (props.dataAdapter?.isUserInGroup) {
        try {
          const hasAccess = await props.dataAdapter.isUserInGroup(
            strings.Provision.ProvisionGroupName
          )
          setHasProjectProvisionAccess(hasAccess)
        } catch {
          setHasProjectProvisionAccess(false)
        }
      } else {
        setHasProjectProvisionAccess(true)
      }
    }

    checkProjectProvisionAccess()
  }, [props.hasProjectProvisionAccess, props.dataAdapter])

  return {
    state,
    setState,
    column,
    setColumn,
    reset,
    toasterId,
    fluentProviderId,
    hasProjectProvisionAccess
  }
}
