import { IMessageBarStyleProps, IMessageBarStyles, IStyleFunctionOrObject } from '@fluentui/react'
import { IUserMessageProps } from './types'

export function useUserMessage(props: IUserMessageProps): { styles: Partial<IMessageBarStyles> } {
  const styles: IStyleFunctionOrObject<IMessageBarStyleProps, IMessageBarStyles> = {
    root: props.styles['root'],
  }

  if (props.fixedCenter) {
    styles.root = {
      ...styles['root'] as any,
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
