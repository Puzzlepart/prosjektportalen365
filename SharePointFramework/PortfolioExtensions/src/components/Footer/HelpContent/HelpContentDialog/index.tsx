import React, { FC, ReactElement, ReactNode, useContext } from 'react'
import styles from './HelpContentDialog.module.scss'
import { FooterContext } from 'components/Footer/context'
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogProps,
  DialogSurface,
  DialogTitle,
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
import { customLightTheme, getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'

export const HelpContentDialog: FC<Omit<DialogProps, 'children'> & { children?: ReactNode }> = (
  props
) => {
  const fluentProviderId = useId('fp-help-dialog')
  const tabsId = useId('help-tab')
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
              {/* The dialog's name, with a button that closes it; it had neither (WCAG 4.1.2). */}
              <DialogTitle
                action={
                  <DialogTrigger action='close'>
                    <Button
                      appearance='subtle'
                      aria-label={strings.CloseLabel}
                      icon={getFluentIcon('Dismiss')}
                    />
                  </DialogTrigger>
                }
              >
                {strings.HelpContentDialogTitle}
              </DialogTitle>
              <DialogContent className={styles.content}>
                {!context.isHelpContentLoaded || context.isHelpContentLoading ? (
                  <Spinner size='tiny' label={strings.HelpContentAvailableLabel} />
                ) : context.helpContent.length === 0 ? (
                  <div>{strings.HelpContentUnavailableDescription}</div>
                ) : (
                  <>
                    <TabList selectedValue={activeValue} onTabSelect={onTabSelect}>
                      {context.helpContent.map((content, index) => (
                        <Tab key={index} id={`${tabsId}-${index}`} value={content.title}>
                          {content.title}
                        </Tab>
                      ))}
                    </TabList>
                    {context.helpContent.map(
                      (content, index) =>
                        activeValue === content.title && (
                          <Content
                            key={content.title}
                            content={content}
                            tabId={`${tabsId}-${index}`}
                          />
                        )
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
