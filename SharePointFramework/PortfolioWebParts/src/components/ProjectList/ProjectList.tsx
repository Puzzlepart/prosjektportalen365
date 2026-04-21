import {
  FluentProvider,
  IdPrefixProvider,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Overflow,
  OverflowItem,
  SelectTabData,
  Tab,
  TabList,
  useIsOverflowItemVisible,
  useOverflowMenu
} from '@fluentui/react-components'
import { MoreHorizontalRegular } from '@fluentui/react-icons'
import * as strings from 'PortfolioWebPartsStrings'
import { ProjectInformationPanel } from 'pp365-projectwebparts/lib/components/ProjectInformationPanel'
import { SiteContext, UserMessage, customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { find, isEmpty } from 'underscore'
import styles from './ProjectList.module.scss'
import { IProjectListProps } from './types'
import { useProjectList } from './useProjectList'
import { useProjectListRenderer } from './useProjectListRenderer'
import { ProjectListContext } from './context'
import { Commands } from './Commands'
import resource from 'SharedResources'
import { IProjectListVertical } from './types'

const OverflowMenuItem: FC<{
  vertical: IProjectListVertical
  onClick: (key: string) => void
}> = ({ vertical, onClick }) => {
  const isVisible = useIsOverflowItemVisible(String(vertical.key))
  if (isVisible) return null
  const Icon = vertical.icon
  return (
    <MenuItem key={vertical.key} icon={<Icon />} onClick={() => onClick(String(vertical.key))}>
      {vertical.text}
    </MenuItem>
  )
}

const OverflowMenu: FC<{
  verticals: IProjectListVertical[]
  onSelect: (key: string) => void
}> = ({ verticals, onSelect }) => {
  const { ref, isOverflowing, overflowCount } = useOverflowMenu<HTMLButtonElement>()
  if (!isOverflowing) return null
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Tab ref={ref} role='tab' value='overflow-menu' icon={<MoreHorizontalRegular />}>
          +{overflowCount}
        </Tab>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {verticals.map((v) => (
            <OverflowMenuItem key={v.key} vertical={v} onClick={onSelect} />
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

export const ProjectList: FC<IProjectListProps> = (props) => {
  const context = useProjectList(props)
  const renderProjects = useProjectListRenderer(context)

  if (context.state.projects.length === 0) {
    return (
      <IdPrefixProvider value={context.fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <section className={styles.projectList}>
            <UserMessage
              title={strings.NoProjectsFoundTitle}
              text={strings.NoProjectsFoundMessage}
            />
          </section>
        </FluentProvider>
      </IdPrefixProvider>
    )
  }

  if (context.state.error) {
    return (
      <IdPrefixProvider value={context.fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <section className={styles.projectList}>
            <UserMessage
              title={strings.ErrorFetchingProjectsTitle}
              text={context.state.error}
              intent='error'
            />
          </section>
        </FluentProvider>
      </IdPrefixProvider>
    )
  }

  return (
    <ProjectListContext.Provider value={context}>
      <IdPrefixProvider value={context.fluentProviderId}>
        <FluentProvider theme={customLightTheme} style={{ background: 'transparent' }}>
          <div className={styles.projectList}>
            <div className={styles.tabs}>
              <Overflow>
                <TabList
                  className={styles.tabList}
                  onTabSelect={(_, data: SelectTabData) => {
                    if (data.value === 'overflow-menu') return
                    context.setState({
                      selectedVertical: find(context.verticals, (v) => v.key === data.value)
                    })
                  }}
                  selectedValue={context.state.selectedVertical?.key}
                >
                  {context.state.isDataLoaded &&
                    context.verticals
                      .filter((vertical) => !vertical.isHidden || !vertical.isHidden(context.state))
                      .map((vertical) => {
                        const Icon = vertical.icon
                        return (
                          <OverflowItem key={vertical.key} id={String(vertical.key)}>
                            <Tab key={vertical.key} value={vertical.value} icon={<Icon />}>
                              {vertical.text}
                            </Tab>
                          </OverflowItem>
                        )
                      })}
                  <OverflowMenu
                    verticals={context.verticals.filter(
                      (vertical) => !vertical.isHidden || !vertical.isHidden(context.state)
                    )}
                    onSelect={(key) =>
                      context.setState({
                        selectedVertical: find(context.verticals, (v) => v.key === key)
                      })
                    }
                  />
                </TabList>
              </Overflow>
            </div>
            <Commands />
            {context.state.isDataLoaded && isEmpty(context.projects) && (
              <div className={styles.emptyMessage}>
                <UserMessage
                  title={strings.NoProjectsFoundTitle}
                  text={strings.ProjectListEmptyMessage}
                />
              </div>
            )}
            <div className={styles.projects}>{renderProjects(context.projects)}</div>
            <ProjectInformationPanel
              {...SiteContext.create(
                props.spfxContext,
                context.state.showProjectInfo?.siteId,
                context.state.showProjectInfo?.url
              )}
              page='Portfolio'
              hidden={!context.state.showProjectInfo}
              hideAllActions={true}
              panelProps={{
                headerText: context.state.showProjectInfo?.title,
                onDismiss: () => {
                  context.setState({ showProjectInfo: null })
                }
              }}
            />
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectListContext.Provider>
  )
}

ProjectList.defaultProps = {
  sortBy: 'Title',
  showSearchBox: true,
  showRenderModeSelector: true,
  showSortBy: true,
  defaultRenderMode: 'tiles',
  verticalConfigs: [
    {
      title: strings.ProjectsAccessHeaderText,
      iconName: 'LockOpen',
      clientFilter: '{"hasUserAccess":true}',
      fieldFilter: '',
      visibilityRule: '',
      requiresAccess: false,
      isDefault: false,
      searchBoxPlaceholder: strings.ProjectsAccessSearchBoxPlaceholderText
    },
    {
      title: strings.MyProjectsHeaderText,
      iconName: 'PersonCircle',
      clientFilter: '{"isUserMember":true}',
      fieldFilter: '',
      visibilityRule: '',
      requiresAccess: false,
      isDefault: true,
      searchBoxPlaceholder: strings.MyProjectsSearchBoxPlaceholderText
    },
    {
      title: strings.AllProjectsHeaderText,
      iconName: 'Cube',
      clientFilter: '',
      fieldFilter: '',
      visibilityRule: '{"isUserInPortfolioManagerGroup":true}',
      requiresAccess: false,
      isDefault: false,
      searchBoxPlaceholder: strings.AllProjectsSearchBoxPlaceholderText
    },
    {
      title: strings.ParentProjectsHeaderText,
      iconName: 'BoxMultiple',
      clientFilter: '',
      fieldFilter: '{"GtIsParentProject":true}',
      visibilityRule: '',
      requiresAccess: true,
      isDefault: false,
      searchBoxPlaceholder: strings.ParentProjectsSearchBoxPlaceholderText
    },
    {
      title: strings.ProgramsHeaderText,
      iconName: 'BoxMultiple',
      clientFilter: '',
      fieldFilter: '{"GtIsProgram":true}',
      visibilityRule: '',
      requiresAccess: true,
      isDefault: false,
      searchBoxPlaceholder: strings.ProgramSearchBoxPlaceholderText
    }
  ],
  useDynamicColors: true,
  showProjectLogo: true,
  primaryField: 'GtProjectServiceAreaText',
  secondaryField: 'GtProjectTypeText',
  primaryUserField: 'GtProjectOwner',
  secondaryUserField: 'GtProjectManager',
  projectMetadata: [
    'PrimaryField',
    'SecondaryField',
    'PrimaryUserField',
    'SecondaryUserField',
    'ProjectPhase'
  ],
  quickLaunchMenu: [
    {
      order: 10,
      text: resource.Navigation_ProjectStatus_Title,
      relativeUrl: `/${resource.Navigation_ProjectStatus_Url}`
    },
    {
      order: 20,
      text: resource.Navigation_Documents_Title,
      relativeUrl: `/${resource.Navigation_Documents_Url}`
    },
    {
      order: 30,
      text: resource.Navigation_PhaseChecklist_Title,
      relativeUrl: `/${resource.Navigation_PhaseChecklist_Url}`
    },
    {
      order: 40,
      text: resource.Navigation_Tasks_Title,
      relativeUrl: `/${resource.Navigation_Tasks_Url}`
    }
  ]
}
