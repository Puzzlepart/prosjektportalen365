import {
  Badge,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  FluentProvider,
  IdPrefixProvider,
  Link,
  mergeClasses,
  OverlayDrawer,
  Spinner,
  useId
} from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import { customLightTheme, UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useState } from 'react'
import { CatalogToolbar } from '../CatalogToolbar'
import { InstallProgress } from '../InstallProgress'
import { PackageDetails } from '../PackageDetails'
import { PackageList } from '../PackageList'
import { TemplatePackageCatalogContext } from './context'
import styles from './TemplatePackageCatalog.module.scss'
import { ITemplatePackageCatalogProps } from './types'
import { useTemplatePackageCatalog } from './useTemplatePackageCatalog'

export const TemplatePackageCatalog: FC<ITemplatePackageCatalogProps> = (props) => {
  const fluentProviderId = useId('fp-template-package-catalog')
  const ctx = useTemplatePackageCatalog(props)
  const { state } = ctx
  const [open, setOpen] = useState(true)

  const close = () => {
    setOpen(false)
    props.onDismiss()
  }

  return (
    <TemplatePackageCatalogContext.Provider value={ctx}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <OverlayDrawer
            role="dialog"
            position="end"
            open={open}
            className={styles.surface}
            onOpenChange={(_, data) => {
              if (!data.open) close()
            }}
          >
            <DrawerHeader>
              <DrawerHeaderTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label={strings.CatalogCloseAria}
                    icon={<Dismiss24Regular />}
                    onClick={close}
                  />
                }
              >
                {strings.CatalogDrawerTitle}{' '}
                <Badge appearance="filled" color="brand" size="small">
                  {strings.CatalogNewBadge}
                </Badge>
              </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody>
              <p className={styles.subtitle}>{strings.CatalogSubtitle}</p>

              {state.notification && (
                <div className={styles.banner}>
                  <UserMessage intent={state.notification.intent} text={state.notification.text} />
                </div>
              )}
              {state.degraded && (
                <div className={styles.banner}>
                  <UserMessage
                    intent="warning"
                    title={strings.CatalogLoadErrorTitle}
                    text={strings.CatalogLoadErrorText}
                  />
                </div>
              )}

              {state.loading ? (
                <div className={styles.loading}>
                  <Spinner label={strings.CatalogLoadingText} />
                </div>
              ) : (
                <div className={styles.body}>
                  <div className={mergeClasses(state.detailOpen && styles.collapsedHidden)}>
                    <CatalogToolbar />
                  </div>
                  <div className={styles.grid}>
                    <div
                      className={mergeClasses(
                        styles.master,
                        state.detailOpen && styles.collapsedHidden
                      )}
                    >
                      <PackageList />
                    </div>
                    <div
                      className={mergeClasses(
                        styles.detail,
                        !state.detailOpen && styles.detailCollapsedHidden
                      )}
                    >
                      {state.installProgress ? <InstallProgress /> : <PackageDetails />}
                    </div>
                  </div>
                </div>
              )}

              {props.userGuideUrl && (
                <div className={styles.footer}>
                  <Link href={props.userGuideUrl} target="_blank">
                    {strings.CatalogUserGuideLinkText}
                  </Link>
                </div>
              )}
            </DrawerBody>
          </OverlayDrawer>
        </FluentProvider>
      </IdPrefixProvider>
    </TemplatePackageCatalogContext.Provider>
  )
}
