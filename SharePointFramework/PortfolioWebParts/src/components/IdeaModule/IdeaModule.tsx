import React, { FC } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import { FluentProvider, IdPrefixProvider, Spinner, Tooltip } from '@fluentui/react-components'
import { customLightTheme, setUrlHash, UserMessage } from 'pp365-shared-library'
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
  bundleIcon,
  PersonCircle24Regular
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

  console.log({ state })

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          {state.loading ? (
            <Spinner label='Laster inn idémodulen' size='extra-large' />
          ) : (
            <div className={styles.ideaModule}>
              <NavDrawer
                defaultSelectedValue='1'
                defaultSelectedCategoryValue='3'
                openCategories={['3', '5']}
                open={isOpen}
                type={'inline'}
                size='small'
              >
                <NavDrawerHeader>
                  <Tooltip content='Navigation' relationship='label'>
                    {renderHamburgerWithToolTip()}
                  </Tooltip>
                </NavDrawerHeader>
                <NavDrawerBody>
                  <AppItemStatic icon={<PersonCircle24Regular />}>Idémodul</AppItemStatic>
                  <NavItem href='#' icon={<Dashboard />} value='1'>
                    Totaloversikt
                  </NavItem>
                  <NavSectionHeader>Registrerte idéer</NavSectionHeader>
                  <NavItem href='#' icon={<Dashboard />} value='2'>
                    Oversikt
                  </NavItem>
                  <NavCategory value='3'>
                    <NavCategoryItem icon={<Lightbulb />}>Idéer</NavCategoryItem>
                    <NavSubItemGroup>
                      {state.ideas.data.items.map((idea, idx) => (
                        <NavSubItem
                          value={`reg${idx}`}
                          key={`reg${idx}`}
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
                  <NavSectionHeader>Idéer under behandling</NavSectionHeader>
                  <NavItem href='#' icon={<Dashboard />} value='4'>
                    Oversikt
                  </NavItem>
                  <NavCategory value='5'>
                    <NavCategoryItem icon={<JobPostings />}>Idéer</NavCategoryItem>
                    <NavSubItemGroup>
                      {state.ideas.data.items.map((idea, idx) => (
                        <NavSubItem
                          value={`proc${idx}`}
                          key={`proc${idx}`}
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
                <div className={styles.idea}>
                  {state.selectedIdea ? (
                    <>
                      <h1 className={styles.ideaTitle}>{state.selectedIdea.item.Title}</h1>
                      {state.selectedIdea.fieldValues.map((model, idx) => (
                        <IdeaField key={idx} model={model} />
                      ))}
                    </>
                  ) : (
                    <Spinner label='Laster inn idé' size='medium' />
                  )}
                </div>
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
