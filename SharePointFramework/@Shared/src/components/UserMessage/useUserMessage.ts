import { IMessageBarStyleProps, IMessageBarStyles } from 'office-ui-fabric-react/lib/MessageBar'
import { IStyleFunctionOrObject } from 'office-ui-fabric-react'
import { IUserMessageProps } from './types'

export function useUserMessage(props: IUserMessageProps) {
  const styles: IStyleFunctionOrObject<IMessageBarStyleProps, IMessageBarStyles> = {}

  if (props.fixedCenter) {
    styles.root = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: props.fixedCenter
    }
  }

  if (props.isCompact) {
    styles.text = {
      marginTop: '3px',
      marginBottom: '0px'
    }
  }
  return { styles } as const
}
