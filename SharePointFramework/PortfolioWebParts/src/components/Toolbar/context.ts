import { createContext, useContext } from 'react'
import { IToolbarProps } from './types'

export interface IToolbarContext {
  props: IToolbarProps
}

export const ToolbarContext = createContext<IToolbarContext>(null)

export const useToolbarContext = () => useContext(ToolbarContext)
