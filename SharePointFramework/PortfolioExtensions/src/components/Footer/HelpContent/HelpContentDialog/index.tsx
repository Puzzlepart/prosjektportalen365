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
  SelectTabData,
  SelectTabEvent,
  Tab,
  TabList,
  TabValue
} from '@fluentui/react-components'
import { Content } from './Content'
import { Fluent } from 'pp365-shared-library'

export const HelpContentDialog: FC<Omit<DialogProps, 'children'>> = (props) => {
  const context = useContext(FooterContext)
  const [selectedValue, setSelectedValue] = React.useState<TabValue>(
    context.props.helpContent[0]?.title
  )

  const onTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value)
  }

  return (
    <Fluent className={styles.helpContentDialog}>
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
    </Fluent>
  )
}
