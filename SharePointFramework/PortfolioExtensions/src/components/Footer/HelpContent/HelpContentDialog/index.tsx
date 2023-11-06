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
  SelectTabData,
  SelectTabEvent,
  Tab,
  TabList,
  TabValue,
  useId,
  webLightTheme
} from '@fluentui/react-components'
import { Content } from './Content'

export const HelpContentDialog: FC<Omit<DialogProps, 'children'>> = (props) => {
  const fluentProviderId = useId('fp-helpDialog')
  const context = useContext(FooterContext)
  const [selectedValue, setSelectedValue] = React.useState<TabValue>(
    context.props.helpContent[0]?.title
  )

  const onTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value)
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={webLightTheme} className={styles.helpContentDialog}>
        <Dialog open={props.open}>
          <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogContent className={styles.content}>
                <TabList selectedValue={selectedValue} onTabSelect={onTabSelect}>
                  {context.props.helpContent.map((content, index) => (
                    <Tab key={index} value={content.title}>
                      {content.title}
                    </Tab>
                  ))}
                </TabList>
                {context.props.helpContent.map(
                  (content) => selectedValue === content.title && <Content content={content} />
                )}
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
