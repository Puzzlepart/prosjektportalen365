import { IDetailsHeaderProps, IRenderFunction } from '@fluentui/react'
import React, { useMemo } from 'react'
import { IListProps } from '../types'
import { ListHeader } from './ListHeader'

export const useOnRenderDetailsHeader = (props: IListProps): IRenderFunction<IDetailsHeaderProps> =>
  useMemo(
    () => (headerProps, defaultRender) =>
      <ListHeader {...props} headerProps={headerProps} defaultRender={defaultRender} />,
    [props]
  )
