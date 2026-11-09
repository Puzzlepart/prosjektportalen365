import React, { FC } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import * as strings from 'PortfolioWebPartsStrings'
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Divider,
  FluentProvider,
  IdPrefixProvider,
  Spinner,
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
} from '@fluentui/react-components'
import {
  customLightTheme,
  getFluentIcon,
  setUrlHash,
  UserMessage,
  withDefaults
} from 'pp365-shared-library'
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
import resource from 'SharedResources'

const Dashboard = bundleIcon(Board20Filled, Board20Regular)
const Lightbulb = bundleIcon(Lightbulb20Filled, Lightbulb20Regular)
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular)

const IDEA_MODULE_DEFAULT_PROPS: Partial<IIdeaModuleProps> = {
  dataSource: strings.Idea.RegisteredIdeasTitle,
  dataSourceCategory: strings.Idea.ModuleTitle,
  showCommandBar: true,
  showExcelExportButton: true,
  showFilters: true,
  showViewSelector: true,
  lockedColumns: false,
  ideaConfigurationList: resource.Lists_Idea_Configuration_Title,
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

export const IdeaModule: FC<IIdeaModuleProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, IDEA_MODULE_DEFAULT_PROPS)
  const {
    state,
    setState,
    getSelectedIdea,
    getSelectedView,
    renderHamburger,
    menuButtonRef,
    contentButtonRef,
    renderStatus,
    handleToggle,
    ignoreFields,
    isOpen,
    closeMenuOnNarrowScreen,
    openItems,
    fluentProviderId
  } = useIdeaModule(props)

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {state.loading ? (
            <Spinner
              className={styles.loading}
              label={strings.Idea.ModuleLoadingText}
              size='extra-large'
            />
          ) : (
            <div className={styles.ideaModule}>
              <NavDrawer
                selectedValue={
                  state.selectedView ? 'overview' : `nav${state.selectedIdea?.item.Id.toString()}`
                }
                defaultSelectedCategoryValue={
                  state.selectedIdea?.item?.processing?.Id ? 'processingIdeas' : 'registrationIdeas'
                }
                defaultOpenCategories={
                  state.selectedIdea?.item?.processing?.Id
                    ? ['processingIdeas']
                    : ['registrationIdeas']
                }
                open={isOpen}
                type='inline'
                size='small'
                className={styles.nav}
              >
                <NavDrawerHeader>{renderHamburger(menuButtonRef)}</NavDrawerHeader>
                <NavDrawerBody className={styles.navBody}>
                  <AppItemStatic icon={getFluentIcon('Lightbulb')}>
                    {strings.Idea.ModuleTitle}
                  </AppItemStatic>
                  <NavItem
                    icon={<Dashboard />}
                    key='overview'
                    value='overview'
                    onClick={() => {
                      setUrlHash({ viewId: _.first(props.configuration.views).id })
                      getSelectedView()
                      closeMenuOnNarrowScreen()
                    }}
                  >
                    {strings.Idea.OverviewTitle}
                  </NavItem>
                  <NavSectionHeader>{strings.Idea.RegistrationSectionTitle}</NavSectionHeader>
                  <NavCategory value='registrationIdeas'>
                    <NavCategoryItem icon={<Lightbulb />} value='registration'>
                      {strings.Idea.RegisteredIdeasTitle}
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
                                closeMenuOnNarrowScreen()
                              }}
                            >
                              {idea?.Title}
                            </NavSubItem>
                          ))
                      ) : (
                        <div className={styles.noIdeas}>{strings.Idea.NoRegisteredIdeasText}</div>
                      )}
                    </NavSubItemGroup>
                  </NavCategory>
                  <NavDivider />
                  <NavSectionHeader>{strings.Idea.ProcessingSectionTitle}</NavSectionHeader>
                  <NavCategory value='processingIdeas'>
                    <NavCategoryItem icon={<JobPostings />} value='processing'>
                      {strings.Idea.ProcessingIdeasTitle}
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
                                closeMenuOnNarrowScreen()
                              }}
                            >
                              {idea?.Title}
                            </NavSubItem>
                          ))
                      ) : (
                        <div className={styles.noIdeas}>{strings.Idea.NoProcessingIdeasText}</div>
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
                  <div className={styles.hamburger}>
                    {!isOpen && renderHamburger(contentButtonRef)}
                  </div>
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
                        <div className={styles.hamburger}>
                          {!isOpen && renderHamburger(contentButtonRef)}
                        </div>
                        <IdeaPhaseBar />
                      </div>
                      {/* Below the page's title, as a web part's heading is (WCAG 1.3.1). */}
                      <h2 className={styles.ideaTitle}>{state.selectedIdea.item.Title}</h2>
                    </div>
                    {!state.selectedIdea.item.processing && (
                      <dl className={styles.idea}>
                        {state.selectedIdea.registeredFieldValues
                          .filter((model) => !ignoreFields.includes(model.internalName))
                          .map((model, idx) => (
                            <IdeaField key={idx} model={model} />
                          ))}
                      </dl>
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
                              {strings.Idea.RegisteredIdeaTitle}
                            </AccordionHeader>
                            <AccordionPanel style={{ margin: 0 }}>
                              <dl className={styles.idea}>
                                {state.selectedIdea.registeredFieldValues.map((model, idx) => (
                                  <IdeaField key={idx} model={model} />
                                ))}
                              </dl>
                            </AccordionPanel>
                          </AccordionItem>
                        </Accordion>
                        <Divider />
                      </>
                    )}
                    <dl className={styles.idea}>
                      {state.selectedIdea.processingFieldValues
                        ?.filter((model) => !ignoreFields.includes(model.internalName))
                        .map((model, idx) => (
                          <IdeaField key={idx} model={model} />
                        ))}
                    </dl>
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

IdeaModule.displayName = 'IdeaModule'
