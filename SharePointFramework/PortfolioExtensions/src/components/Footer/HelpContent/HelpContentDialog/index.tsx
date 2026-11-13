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
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import strings from 'PortfolioExtensionsStrings'

/** Loads page help on opening and presents entries as tabs in a dialog. */
export const HelpContentDialog: FC<Omit<DialogProps, 'children'> & { children?: ReactNode }> = (
  props
) => {
  const fluentProviderId = useId('fp-help-dialog')
  const tabsId = useId('help-tab')
  const context = useContext(FooterContext)
  const telemetry = useTelemetry()
  const [selectedValue, setSelectedValue] = React.useState<TabValue>()
  // A tab chosen on another page is not among this page's help: the dialog stays mounted with
  // the footer across navigations.
  const activeValue = context.helpContent.some((content) => content.title === selectedValue)
    ? selectedValue
    : context.helpContent[0]?.title

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
            if (data.open) {
              context.loadHelpContent()
              // Only that the help was opened is counted, not which page or entry.
              telemetry.track('help.opened')
            }
          }}
        >
          <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
          <DialogSurface>
            <DialogBody>
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
