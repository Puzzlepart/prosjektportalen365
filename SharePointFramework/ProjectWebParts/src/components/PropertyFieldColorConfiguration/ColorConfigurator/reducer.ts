import { IColor } from '@fluentui/react'
import { createAction, createReducer } from '@reduxjs/toolkit'
import _, { pick } from 'underscore'
import { DynamicMatrixColorScaleConfig } from '../../DynamicMatrix'
import { IColorConfiguratorProps, IColorConfiguratorState } from './types'

export const INIT = createAction<{ config: DynamicMatrixColorScaleConfig }>('INIT')
export const SET_CONFIG = createAction<{ count: number }>('SET_CONFIG')
export const CHANGE_CONFIG = createAction<{
  index: number
  color?: IColor
  percentage?: number
}>('CHANGE_CONFIG')
export const REVERT_CONFIG = createAction('REVERT_CONFIG')

export default (props: IColorConfiguratorProps) =>
  createReducer({ config: [] } as IColorConfiguratorState, {
    [INIT.type]: (state: IColorConfiguratorState) => {
      state.config = props.value ?? props.defaultValue
    },
    [SET_CONFIG.type]: (
      state: IColorConfiguratorState,
      { payload }: ReturnType<typeof SET_CONFIG>
    ) => {
      const inc = payload.count - state.config.length
      const lastConfig = _.last(state.config)
      if (inc > 0) {
        for (let i = 0; i < inc; i++) {
          const newConfig = props.defaultValue[state.config.length + i] ?? lastConfig
          state.config.push(newConfig)
        }
      } else state.config = state.config.splice(0, payload.count)
    },
    [CHANGE_CONFIG.type]: (
      state: IColorConfiguratorState,
      { payload }: ReturnType<typeof CHANGE_CONFIG>
    ) => {
      state.config = state.config.map((c, i) =>
        payload.index === i
          ? payload.color
            ? { p: c.p, ...pick(payload.color, 'r', 'g', 'b') }
            : { p: payload.percentage, ...pick(c, 'r', 'g', 'b') }
          : c
      )
    },
    [REVERT_CONFIG.type]: (state: IColorConfiguratorState) => {
      state.config = props.defaultValue
    }
  })
