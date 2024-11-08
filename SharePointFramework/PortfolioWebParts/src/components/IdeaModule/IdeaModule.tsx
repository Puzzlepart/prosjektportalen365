import React, { FC } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import {
  Divider,
  FluentProvider,
  IdPrefixProvider,
  Spinner,
  Tab,
  TabList,
  Tooltip
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon, setUrlHash, UserMessage } from 'pp365-shared-library'
import {
  Hamburger,
  NavCategory,
  NavCategoryItem,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  NavSubItem,
  NavSubItemGroup,
  NavDivider,
  AppItemStatic
} from '@fluentui/react-nav-preview'
import {
  Board20Filled,
  Board20Regular,
  NotePin20Filled,
  NotePin20Regular,
  Lightbulb20Filled,
  Lightbulb20Regular,
  bundleIcon
} from '@fluentui/react-icons'
import { IdeaField } from './IdeaField'

const Dashboard = bundleIcon(Board20Filled, Board20Regular)
const Lightbulb = bundleIcon(Lightbulb20Filled, Lightbulb20Regular)
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular)

export const IdeaModule: FC<IIdeaModuleProps> = (props) => {
  const { state, setState, getSelectedIdea, fluentProviderId } = useIdeaModule(props)
  const [isOpen, setIsOpen] = React.useState(true)

  const renderHamburgerWithToolTip = () => {
    return (
      <Tooltip content='Navigation' relationship='label'>
        <Hamburger onClick={() => setIsOpen(!isOpen)} />
      </Tooltip>
    )
  }

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {state.loading ? (
            <Spinner label='Laster inn idémodulen' size='extra-large' />
          ) : (
            <div className={styles.ideaModule}>
              <NavDrawer
                defaultSelectedValue={state.selectedIdea?.item.Id.toString()}
                // selectedCategoryValue={state.selectedIdea?.item.processing ? 'behandlingIdeer' : 'registreringIdeer'}
                openCategories={['registreringIdeer', 'behandlingIdeer']}
                open={isOpen}
                type='inline'
                size='small'
              >
                <NavDrawerHeader>
                  <Tooltip content='Navigation' relationship='label'>
                    {renderHamburgerWithToolTip()}
                  </Tooltip>
                </NavDrawerHeader>
                <NavDrawerBody>
                  <AppItemStatic icon={getFluentIcon('Lightbulb')}>Idémodul</AppItemStatic>
                  <NavItem href='#' icon={<Dashboard />} value='total'>
                    Totaloversikt
                  </NavItem>
                  <NavSectionHeader>Registrering</NavSectionHeader>
                  <NavItem href='#' icon={<Dashboard />} value='registrering'>
                    Oversikt
                  </NavItem>
                  <NavCategory value='registreringIdeer'>
                    <NavCategoryItem icon={<Lightbulb />}>Mine idéer</NavCategoryItem>
                    <NavSubItemGroup>
                      {state.ideas.data.items.filter((idea) => !idea.processing).map((idea) => (
                        <NavSubItem
                          value={idea.Id.toString()}
                          onClick={() => {
                            setUrlHash({ ideaId: idea.Id.toString() })
                            getSelectedIdea()
                          }}
                        >
                          {idea?.Title}
                        </NavSubItem>
                      ))}
                    </NavSubItemGroup>
                  </NavCategory>
                  <NavDivider />
                  <NavSectionHeader>Behandling</NavSectionHeader>
                  <NavItem href='#' icon={<Dashboard />} value='behandling'>
                    Oversikt
                  </NavItem>
                  <NavCategory value='behandlingIdeer'>
                    <NavCategoryItem icon={<JobPostings />}>Mine idéer</NavCategoryItem>
                    <NavSubItemGroup>
                      {state.ideas.data.items.filter((idea) => idea.processing).map((idea) => (
                        <NavSubItem
                          value={idea.Id.toString()}
                          onClick={() => {
                            setUrlHash({ ideaId: idea.Id.toString() })
                            getSelectedIdea()
                          }}
                        >
                          {idea?.Title}
                        </NavSubItem>
                      ))}
                    </NavSubItemGroup>
                  </NavCategory>
                </NavDrawerBody>
              </NavDrawer>
              <div className={styles.content}>
                {state.error && (
                  <UserMessage
                    title='Det skjedde en feil ved innlastning av Idémodulen'
                    text={state.error}
                    intent='error'
                  />
                )}
                {state.selectedIdea ? (
                  <>
                    <div className={styles.ideaHeader}>
                      <TabList className={styles.ideaPhases} defaultSelectedValue='tab3'>
                        <Tab
                          icon={getFluentIcon('Lightbulb')}
                          value='tab1'
                          disabled
                          style={{ cursor: 'default' }}
                        >
                          Registrering av idé
                        </Tab>
                        <Tab
                          icon={getFluentIcon('ChevronRight')}
                          value={null}
                          disabled
                          style={{ cursor: 'default' }}
                        />
                        <Tab
                          icon={getFluentIcon('CheckmarkCircle')}
                          value='tab2'
                          disabled
                          style={{ cursor: 'default' }}
                        >
                          Godkjent for behandling
                        </Tab>
                        <Tab
                          icon={getFluentIcon('ChevronRight')}
                          value={null}
                          disabled
                          style={{ cursor: 'default' }}
                        />
                        <Tab
                          icon={getFluentIcon('Edit')}
                          value='tab3'
                          style={{ cursor: 'default' }}
                        >
                          Behandling av idé
                        </Tab>
                        <Tab
                          icon={getFluentIcon('ChevronRight')}
                          value={null}
                          disabled
                          style={{ cursor: 'default' }}
                        />
                        <Tab
                          icon={getFluentIcon('CheckmarkCircle')}
                          value='tab4'
                          disabled
                          style={{ cursor: 'default' }}
                        >
                          Idé godkjent
                        </Tab>
                        <Tab
                          icon={getFluentIcon('ChevronRight')}
                          value={null}
                          disabled
                          style={{ cursor: 'default' }}
                        />
                        <Tab
                          icon={getFluentIcon('BoxToolbox')}
                          value='tab5'
                          disabled
                          style={{ cursor: 'default' }}
                        >
                          Bestill prosjekt
                        </Tab>
                      </TabList>
                      <h1 className={styles.ideaTitle}>{state.selectedIdea.item.Title}</h1>
                    </div>
                    <div className={styles.idea}>
                      {state.selectedIdea.registeredFieldValues.map((model, idx) => (
                        <IdeaField key={idx} model={model} />
                      ))}
                    </div>
                    <Divider />
                    <div className={styles.idea}>
                      {state.selectedIdea.processingFieldValues?.map((model, idx) => (
                        <IdeaField key={idx} model={model} />
                      ))}
                    </div>
                  </>
                ) : (
                  <Spinner label='Laster inn idé' size='medium' />
                )}
                {!isOpen && renderHamburgerWithToolTip()}
              </div>
            </div>
          )}
        </FluentProvider>
      </IdPrefixProvider>
    </IdeaModuleContext.Provider>
  )
}

IdeaModule.defaultProps = {
  configurationList: 'Idékonfigurasjon',
  configuration: 'Standard',
  sortBy: 'Title',
  showSearchBox: true,
  showRenderModeSelector: true,
  showSortBy: true,
  defaultRenderMode: 'tiles'
}
