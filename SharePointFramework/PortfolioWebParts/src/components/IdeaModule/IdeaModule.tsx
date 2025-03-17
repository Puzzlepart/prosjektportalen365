import React, { FC } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  FluentProvider,
  IdPrefixProvider,
  Spinner,
  Tooltip
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon, setUrlHash, UserMessage } from 'pp365-shared-library'
import {
  NavCategory,
  NavCategoryItem,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavSectionHeader,
  NavSubItem,
  NavSubItemGroup,
  NavDivider,
  AppItemStatic,
  NavItem
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
import { IdeaPhaseBar } from './IdeaPhaseBar'
import { PortfolioAggregation } from 'components'
import _ from 'lodash'

const Dashboard = bundleIcon(Board20Filled, Board20Regular)
const Lightbulb = bundleIcon(Lightbulb20Filled, Lightbulb20Regular)
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular)

export const IdeaModule: FC<IIdeaModuleProps> = (props) => {
  const {
    state,
    setState,
    getSelectedIdea,
    getSelectedView,
    renderHamburger,
    renderStatus,
    handleToggle,
    ignoreFields,
    isOpen,
    openItems,
    fluentProviderId
  } = useIdeaModule(props)

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {state.loading ? (
            <Spinner className={styles.loading} label='Laster inn idémodulen' size='extra-large' />
          ) : (
            <div className={styles.ideaModule}>
              <NavDrawer
                selectedValue={
                  state.selectedView ? 'overview' : `nav${state.selectedIdea?.item.Id.toString()}`
                }
                defaultSelectedCategoryValue={
                  state.selectedIdea?.item?.processing?.Id ? 'behandlingIdeer' : 'registreringIdeer'
                }
                defaultOpenCategories={
                  state.selectedIdea?.item?.processing?.Id
                    ? ['behandlingIdeer']
                    : ['registreringIdeer']
                }
                open={isOpen}
                type='inline'
                size='small'
                className={styles.nav}
              >
                <NavDrawerHeader>
                  <Tooltip content='Navigasjonsmeny' relationship='label'>
                    {renderHamburger()}
                  </Tooltip>
                </NavDrawerHeader>
                <NavDrawerBody className={styles.navBody}>
                  <AppItemStatic icon={getFluentIcon('Lightbulb')}>Idémodul</AppItemStatic>
                  <NavItem
                    icon={<Dashboard />}
                    key='overview'
                    value='overview'
                    onClick={() => {
                      setUrlHash({ viewId: _.first(props.configuration.views).id })
                      getSelectedView()
                    }}
                  >
                    Oversikt over idéer
                  </NavItem>
                  <NavSectionHeader>Registrering</NavSectionHeader>
                  <NavCategory value='registreringIdeer'>
                    <NavCategoryItem icon={<Lightbulb />} value='registrering'>
                      Registrerte idéer
                    </NavCategoryItem>
                    <NavSubItemGroup>
                      {state.ideas.data.items.filter((idea) => !idea.processing).length > 0 ? (
                        state.ideas.data.items
                          .filter((idea) => !idea.processing)
                          .map((idea) => (
                            <NavSubItem
                              key={idea.Id.toString()}
                              value={`nav${idea.Id.toString()}`}
                              onClick={() => {
                                setUrlHash({ ideaId: idea.Id.toString() })
                                getSelectedIdea()
                              }}
                            >
                              {idea?.Title}
                            </NavSubItem>
                          ))
                      ) : (
                        <div className={styles.noIdeas}>
                          Det for øyeblikket ingen registrerte idéer, idéer som blir registrert vil
                          dukke opp her.
                        </div>
                      )}
                    </NavSubItemGroup>
                  </NavCategory>
                  <NavDivider />
                  <NavSectionHeader>Behandling</NavSectionHeader>
                  <NavCategory value='behandlingIdeer'>
                    <NavCategoryItem icon={<JobPostings />} value='behandling'>
                      Idéer i behandling
                    </NavCategoryItem>
                    <NavSubItemGroup>
                      {state.ideas.data.items.filter((idea) => idea.processing).length > 0 ? (
                        state.ideas.data.items
                          .filter((idea) => idea.processing)
                          .map((idea) => (
                            <NavSubItem
                              key={idea.Id.toString()}
                              value={`nav${idea.Id.toString()}`}
                              onClick={() => {
                                setUrlHash({ ideaId: idea.Id.toString() })
                                getSelectedIdea()
                              }}
                            >
                              {idea?.Title}
                            </NavSubItem>
                          ))
                      ) : (
                        <div className={styles.noIdeas}>
                          Det for øyeblikket ingen idéer i behandling, idéer i behandling vil dukke
                          opp her.
                        </div>
                      )}
                    </NavSubItemGroup>
                  </NavCategory>
                </NavDrawerBody>
              </NavDrawer>

              {state.error && (
                <div className={styles.error}>
                  <UserMessage
                    title={state.error.title}
                    text={state.error.message}
                    intent='error'
                  />
                </div>
              )}
              {state.selectedView && (
                <div className={styles.overview}>
                  <div className={styles.hamburger}>{!isOpen && renderHamburger()}</div>
                  <div className={styles.ideaList}>
                    <PortfolioAggregation
                      {...props}
                      key={state.selectedView?.id}
                      title={state.selectedView?.title}
                    />
                  </div>
                </div>
              )}
              {state.selectedIdea && (
                <div className={styles.content}>
                  <>
                    {/* <Commands /> */}
                    <div className={styles.ideaHeader}>
                      <div className={styles.phasebar}>
                        <div className={styles.hamburger}>{!isOpen && renderHamburger()}</div>
                        <IdeaPhaseBar />
                      </div>
                      <h1 className={styles.ideaTitle}>{state.selectedIdea.item.Title}</h1>
                    </div>
                    {!state.selectedIdea.item.processing && (
                      <div className={styles.idea}>
                        {state.selectedIdea.registeredFieldValues
                          .filter((model) => !ignoreFields.includes(model.internalName))
                          .map((model, idx) => (
                            <IdeaField key={idx} model={model} />
                          ))}
                      </div>
                    )}
                    {!state.selectedIdea.item.processing && renderStatus()}
                    {state.selectedIdea.item.processing && (
                      <>
                        <Accordion
                          openItems={openItems}
                          onToggle={handleToggle}
                          multiple
                          collapsible
                        >
                          <AccordionItem value='registration'>
                            <AccordionHeader
                              className={styles.accordion}
                              size='large'
                              icon={getFluentIcon('Lightbulb')}
                            >
                              Registrert idé
                            </AccordionHeader>
                            <AccordionPanel style={{ margin: 0 }}>
                              <div className={styles.idea}>
                                {state.selectedIdea.registeredFieldValues.map((model, idx) => (
                                  <IdeaField key={idx} model={model} />
                                ))}
                              </div>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>
                        <Divider />
                      </>
                    )}
                    <div className={styles.idea}>
                      {state.selectedIdea.processingFieldValues
                        ?.filter((model) => !ignoreFields.includes(model.internalName))
                        .map((model, idx) => (
                          <IdeaField key={idx} model={model} />
                        ))}
                    </div>
                    {state.selectedIdea.item.processing && renderStatus()}
                  </>
                </div>
              )}
            </div>
          )}
        </FluentProvider>
      </IdPrefixProvider>
    </IdeaModuleContext.Provider>
  )
}

IdeaModule.defaultProps = {
  dataSource: 'Registrerte idéer',
  dataSourceCategory: 'Idémodul',
  showCommandBar: true,
  showExcelExportButton: true,
  showFilters: true,
  showViewSelector: true,
  lockedColumns: false,
  ideaConfigurationList: 'Idékonfigurasjon',
  ideaConfiguration: 'Standard',
  hiddenRegFields: ['Title'],
  hiddenProcFields: [
    'Title',
    'GtIdeaUrl',
    'GtRegistratedIdea',
    'GtIdeaProjectData',
    'GtIdeaStrategicValue',
    'GtIdeaStrategicNumber',
    'GtIdeaQualityBenefit',
    'GtIdeaQualityNumber',
    'GtIdeaEconomicBenefit',
    'GtIdeaEconomicNumber',
    'GtIdeaOperationalNeed',
    'GtIdeaOperationalNumber',
    'GtIdeaRisk',
    'GtIdeaRiskNumber',
    'GtIdeaManualScore',
    'GtIdeaManualComment',
    'GtIdeaScore',
    'GtIdeaPriority'
  ]
}
