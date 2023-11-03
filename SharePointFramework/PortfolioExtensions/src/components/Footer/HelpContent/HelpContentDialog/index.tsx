import { Pivot, PivotItem } from '@fluentui/react'
import React, { FC, ReactElement, useContext } from 'react'
import styles from './HelpContentDialog.module.scss'
import { FooterContext } from 'components/Footer/context'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogProps,
  DialogSurface,
  DialogTrigger,
  FluentProvider,
  IdPrefixProvider,
  useId,
  webLightTheme
} from '@fluentui/react-components'
import { Content } from './Content'

export const HelpContentDialog: FC<Omit<DialogProps, 'children'>> = (props) => {
  const fluentProviderId = useId('fp-helpDialog')
  const context = useContext(FooterContext)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={webLightTheme} className={styles.helpContentDialog}>
        <Dialog open={props.open}>
          <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogContent className={styles.content}>
                <Pivot>
                  {context.props.helpContent.map((content, index) => (
                    <PivotItem key={index} headerText={content.title} style={{
                      overflow: 'auto',
                      height: 'calc(100vh - 285px)'
                    }}>
                      <Content content={content} />
                    </PivotItem>
                  ))}
                </Pivot>
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
