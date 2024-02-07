import { FC, useContext } from 'react'
import { ChangePhaseDialogContext } from '../context'
import { VIEW_MAP } from './VIEW_MAP'

export const Content: FC = () => {
  const { state } = useContext(ChangePhaseDialogContext)
  return VIEW_MAP[state.view] ?? null
}
