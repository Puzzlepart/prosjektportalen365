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
  Spinner,
  Tab,
  TabList,
  TabValue,
  useId
} from '@fluentui/react-components'
import { Content } from './Content'
import { customLightTheme } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'

export const HelpContentDialog: FC<Omit<DialogProps, 'children'>> = (props) => {
  const fluentProviderId = useId('fp-help-dialog')
  const context = useContext(FooterContext)
  const [selectedValue, setSelectedValue] = React.useState<TabValue>()
  const activeValue = selectedValue ?? context.helpContent[0]?.title

  const onTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value)
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.helpContentDialog}>
        <Dialog
          open={props.open}
          onOpenChange={(event, data) => {
            props.onOpenChange?.(event, data)
            if (data.open) context.loadHelpContent()
          }}
        >
          <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogContent className={styles.content}>
                {!context.isHelpContentLoaded || context.isHelpContentLoading ? (
                  <Spinner size='tiny' label={strings.HelpContentAvailableLabel} />
                ) : context.helpContent.length === 0 ? (
                  <div>{strings.HelpContentUnavailableDescription}</div>
                ) : (
                  <>
                    <TabList selectedValue={activeValue} onTabSelect={onTabSelect}>
                      {context.helpContent.map((content, index) => (
                        <Tab key={index} value={content.title}>
                          {content.title}
                        </Tab>
                      ))}
                    </TabList>
                    {context.helpContent.map(
                      (content) => activeValue === content.title && <Content content={content} />
                    )}
                  </>
                )}
              </DialogContent>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
