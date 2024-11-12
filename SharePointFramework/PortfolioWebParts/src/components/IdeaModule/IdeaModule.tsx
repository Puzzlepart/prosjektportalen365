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
  Tooltip
} from '@fluentui/react-components'
import { customLightTheme, getFluentIcon, setUrlHash, UserMessage } from 'pp365-shared-library'
import {
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
import { IdeaPhaseBar } from './IdeaPhaseBar'

const Dashboard = bundleIcon(Board20Filled, Board20Regular)
const Lightbulb = bundleIcon(Lightbulb20Filled, Lightbulb20Regular)
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular)

export const IdeaModule: FC<IIdeaModuleProps> = (props) => {
  const { state, setState, getSelectedIdea, isOpen, renderHamburger, fluentProviderId } =
    useIdeaModule(props)

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {state.loading ? (
            <Spinner label='Laster inn idémodulen' size='extra-large' />
          ) : (
            <div className={styles.ideaModule}>
              <NavDrawer
                  selectedValue={`nav${state.selectedIdea?.item.Id.toString()}`}
                selectedCategoryValue={state.selectedIdea?.item.processing ? 'behandlingIdeer' : 'registreringIdeer'}
                openCategories={['registreringIdeer', 'behandlingIdeer']}
                open={isOpen}
                type='inline'
                size='small'
              >
                <NavDrawerHeader>
                  <Tooltip content='Navigation' relationship='label'>
                    {renderHamburger()}
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
                      {state.ideas.data.items
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
                      {state.ideas.data.items
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
                      <div className={styles.toolbar}>
                        <div className={styles.hamburger}>{!isOpen && renderHamburger()}</div>
                        <IdeaPhaseBar />
                      </div>
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
