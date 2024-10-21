import React, { FC, useState } from 'react'
import styles from './IdeaModule.module.scss'
import { IdeaModuleContext } from './context'
import { IIdeaModuleProps } from './types'
import { useIdeaModule } from './useIdeaModule'
import { FluentProvider, IdPrefixProvider, Tooltip } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
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
  NavSize,
  NavDivider,
  AppItemStatic
} from '@fluentui/react-nav-preview'
import {
  Board20Filled,
  Board20Regular,
  BoxMultiple20Filled,
  BoxMultiple20Regular,
  DataArea20Filled,
  DataArea20Regular,
  DocumentBulletListMultiple20Filled,
  DocumentBulletListMultiple20Regular,
  HeartPulse20Filled,
  HeartPulse20Regular,
  MegaphoneLoud20Filled,
  MegaphoneLoud20Regular,
  NotePin20Filled,
  NotePin20Regular,
  People20Filled,
  People20Regular,
  PeopleStar20Filled,
  PeopleStar20Regular,
  Person20Filled,
  PersonLightbulb20Filled,
  PersonLightbulb20Regular,
  Person20Regular,
  PersonSearch20Filled,
  PersonSearch20Regular,
  PreviewLink20Filled,
  PreviewLink20Regular,
  bundleIcon,
  PersonCircle24Regular
} from '@fluentui/react-icons'

const Person = bundleIcon(Person20Filled, Person20Regular)
const Dashboard = bundleIcon(Board20Filled, Board20Regular)
const Announcements = bundleIcon(MegaphoneLoud20Filled, MegaphoneLoud20Regular)
const EmployeeSpotlight = bundleIcon(PersonLightbulb20Filled, PersonLightbulb20Regular)
const Search = bundleIcon(PersonSearch20Filled, PersonSearch20Regular)
const PerformanceReviews = bundleIcon(PreviewLink20Filled, PreviewLink20Regular)
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular)
const Interviews = bundleIcon(People20Filled, People20Regular)
const HealthPlans = bundleIcon(HeartPulse20Filled, HeartPulse20Regular)
const TrainingPrograms = bundleIcon(BoxMultiple20Filled, BoxMultiple20Regular)
const CareerDevelopment = bundleIcon(PeopleStar20Filled, PeopleStar20Regular)
const Analytics = bundleIcon(DataArea20Filled, DataArea20Regular)
const Reports = bundleIcon(DocumentBulletListMultiple20Filled, DocumentBulletListMultiple20Regular)

export const IdeaModule: FC<IIdeaModuleProps> = (props) => {
  const { state, setState, fluentProviderId } = useIdeaModule(props)

  const [isOpen, setIsOpen] = React.useState(true)
  const [size, setNavSize] = useState<NavSize>('small')
  const [enabledLinks, setEnabledLinks] = useState(true)

  const linkDestination = enabledLinks ? '#' : ''

  const renderHamburgerWithToolTip = () => {
    return (
      <Tooltip content="Navigation" relationship="label">
        <Hamburger onClick={() => setIsOpen(!isOpen)} />
      </Tooltip>
    );
  };

  return (
    <IdeaModuleContext.Provider value={{ props, state, setState }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={styles.ideaModule}>
            <NavDrawer
              defaultSelectedValue='7'
              defaultSelectedCategoryValue='6'
              open={isOpen}
              type={'inline'}
              size={size}
            >
              <NavDrawerHeader>
                <Tooltip content="Navigation" relationship="label">
                  {renderHamburgerWithToolTip()}
                </Tooltip>
              </NavDrawerHeader>
              <NavDrawerBody>
                <AppItemStatic icon={<PersonCircle24Regular />}>Idémodul</AppItemStatic>
                <NavItem href={linkDestination} icon={<Dashboard />} value='1'>
                  Dashboard
                </NavItem>
                <NavItem href={linkDestination} icon={<Announcements />} value='2'>
                  Announcements
                </NavItem>
                <NavItem href={linkDestination} icon={<EmployeeSpotlight />} value='3'>
                  Employee Spotlight
                </NavItem>
                <NavItem icon={<Search />} href={linkDestination} value='4'>
                  Profile Search
                </NavItem>
                <NavItem icon={<PerformanceReviews />} href={linkDestination} value='5'>
                  Performance Reviews
                </NavItem>

                <NavSectionHeader>Employee Management</NavSectionHeader>
                <NavCategory value='6'>
                  <NavCategoryItem icon={<JobPostings />}>Job Postings</NavCategoryItem>
                  <NavSubItemGroup>
                    <NavSubItem href={linkDestination} value='7'>
                      Openings
                    </NavSubItem>
                    <NavSubItem href={linkDestination} value='8'>
                      Submissions
                    </NavSubItem>
                  </NavSubItemGroup>
                </NavCategory>
                <NavItem icon={<Interviews />} value='9'>
                  Interviews
                </NavItem>

                <NavSectionHeader>Benefits</NavSectionHeader>
                <NavItem icon={<HealthPlans />} value='10'>
                  Health Plans
                </NavItem>
                <NavCategory value='11'>
                  <NavCategoryItem icon={<Person />}>Retirement</NavCategoryItem>
                  <NavSubItemGroup>
                    <NavSubItem href={linkDestination} value='13'>
                      Plan Information
                    </NavSubItem>
                    <NavSubItem href={linkDestination} value='14'>
                      Fund Performance
                    </NavSubItem>
                  </NavSubItemGroup>
                </NavCategory>

                <NavDivider />
                <NavItem icon={<TrainingPrograms />} value='15'>
                  Training Programs
                </NavItem>
                <NavCategory value='16'>
                  <NavCategoryItem icon={<CareerDevelopment />}>Career Development</NavCategoryItem>
                  <NavSubItemGroup>
                    <NavSubItem href={linkDestination} value='17'>
                      Career Paths
                    </NavSubItem>
                    <NavSubItem href={linkDestination} value='18'>
                      Planning
                    </NavSubItem>
                  </NavSubItemGroup>
                </NavCategory>
                <NavItem target='_blank' icon={<Analytics />} value='19'>
                  Workforce Data
                </NavItem>
                <NavItem href={linkDestination} icon={<Reports />} value='20'>
                  Reports
                </NavItem>
              </NavDrawerBody>
            </NavDrawer>
            <div className={styles.content}>
              {!isOpen && renderHamburgerWithToolTip()}
              <h1>
                Bring your ideas to life. Here you can create, share and collaborate on ideas.
              </h1>
              <p>
                With the new Idea module, you can create and share ideas with your team. You can
                also collaborate on ideas with your team members.
              </p>
            </div>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </IdeaModuleContext.Provider>
  )
}

IdeaModule.defaultProps = {
  configurationList: 'Idékonfigurasjon',
  sortBy: 'Title',
  showSearchBox: true,
  showRenderModeSelector: true,
  showSortBy: true,
  defaultRenderMode: 'tiles'
}
