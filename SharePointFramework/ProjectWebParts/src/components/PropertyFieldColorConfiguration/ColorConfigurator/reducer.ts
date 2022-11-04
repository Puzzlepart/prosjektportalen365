import { IColor } from '@fluentui/react'
import { createAction, createReducer } from '@reduxjs/toolkit'
import _ from 'underscore'
import { DynamicMatrixColorScaleConfig } from '../../DynamicMatrix'
import { IColorConfiguratorProps, IColorConfiguratorState } from './types'

export const INIT = createAction<{ config: DynamicMatrixColorScaleConfig[] }>('INIT')
export const SET_CONFIG = createAction<{ count: number }>('SET_CONFIG')
export const CHANGE_CONFIG_COLOR = createAction<{ index: number; color: IColor }>(
  'CHANGE_CONFIG_COLOR'
)
export const REVERT_CONFIG = createAction('REVERT_CONFIG')

export default (props: IColorConfiguratorProps) =>
  createReducer(
    { config: [] },
    {
      [INIT.type]: (state: IColorConfiguratorState) => {
        state.config = props.value ?? props.defaultValue
      },
      [SET_CONFIG.type]: (
        state: IColorConfiguratorState,
        { payload }: ReturnType<typeof SET_CONFIG>
      ) => {
        const inc = payload.count - state.config.length
        const lastColor = _.last(state.config)?.color
        if (inc > 0) {
          for (let i = 0; i < inc; i++) {
            state.config.push({
              color: props.defaultValue[state.config.length + i]?.color ?? lastColor
            })
          }
          state.config = state.config.map((c, idx) => ({
            percentage: Math.floor(Math.round((10 + (90 / state.config.length) * idx) / 10) * 10),
            color: c.color
          }))
        } else state.config = [...state.config].splice(0, payload.count)
      },
      [CHANGE_CONFIG_COLOR.type]: (
        state: IColorConfiguratorState,
        { payload }: ReturnType<typeof CHANGE_CONFIG_COLOR>
      ) => {
        state.config = [...state.config].map((c, i) =>
          payload.index === i
            ? { ...c, color: [payload.color.r, payload.color.g, payload.color.b] }
            : c
        )
      },
      [REVERT_CONFIG.type]: (state: IColorConfiguratorState) => {
        state.config = props.defaultValue
      }
    }
  )

// /**
//  * Set configuration
//  *
//  * @param count New count
//  */
// function setConfig(count: number) {
//   const inc = count - config.length
//   const lastColor = _.last(config)?.color
//   $setConfig(($config) => {
//     if (inc > 0) {
//       for (let i = 0; i < inc; i++) {
//         $config.push({
//           color: props.defaultValue[$config.length + i]?.color ?? lastColor
//         })
//       }
//     } else $config = [...$config].splice(0, count)
//     return $config.map((c, idx) => ({
//       percentage: Math.floor(Math.round((10 + (90 / $config.length) * idx) / 10) * 10),
//       color: c.color
//     }))
//   })
// }

// /**
//  * On color change
//  *
//  * @param idx Index
//  * @param color Color
//  */
// function onColorChange(idx: number, color: IColor) {
//   $setConfig(($config) =>
//     $config.map((c, i) => (idx === i ? { ...c, color: [color.r, color.g, color.b] } : c))
//   )
// }
