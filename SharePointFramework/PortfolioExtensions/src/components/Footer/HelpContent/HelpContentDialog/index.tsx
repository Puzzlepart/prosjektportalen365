import { Pivot, PivotItem } from '@fluentui/react'
import React, { FC, ReactElement, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './HelpContentDialog.module.scss'
import { FooterContext } from 'components/Footer/context'
import {
  Button,
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

export const HelpContentDialog: FC<Omit<DialogProps, 'children'>> = (props) => {
  const fluentProviderId = useId('fp-helpDialog')
  const context = useContext(FooterContext)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={webLightTheme} className={styles.helpContentDialog}>
        <Dialog open={props.open}>
          <DialogTrigger disableButtonEnhancement>{props.children as ReactElement}</DialogTrigger>
          <DialogSurface style={{ maxWidth: '800px !important' }}>
            <DialogBody className={styles.body}>
              <DialogContent className={styles.content}>
                <Pivot>
                  {context.props.helpContent.map((content, index) => (
                    <PivotItem
                      key={index}
                      headerText={content.title}
                      itemIcon={content.iconName}
                      style={{
                        overflow: 'auto',
                        height: 'calc(100vh - 250px)',
                        width: 'calc(100vw - 250px)'
                      }}
                    >
                      <div className={styles.contentItem} title={content.title}>
                        <p dangerouslySetInnerHTML={{ __html: content.textContent }}></p>
                        {content.markdownContent && (
                          <ReactMarkdown
                            linkTarget='_blank'
                            rehypePlugins={[rehypeRaw]}
                            transformImageUri={null}
                          >
                            {content.markdownContent}
                          </ReactMarkdown>
                        )}
                        {content.resourceLink && (
                          <Button
                            size='medium'
                            appearance='primary'
                            onClick={() => window.open(content.resourceLink.Url, '_blank')}
                          >
                            <span>{content.resourceLink.Description}</span>
                          </Button>
                        )}
                      </div>
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
