import React, { FC } from 'react'
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
import { useIdeaModuleContext } from '../context'
import { Tooltip } from '@fluentui/react-components'
import { getFluentIcon, setUrlHash } from 'pp365-shared-library'
import { useIdeaModule } from '../useIdeaModule'

const Dashboard = bundleIcon(Board20Filled, Board20Regular)
const Lightbulb = bundleIcon(Lightbulb20Filled, Lightbulb20Regular)
const JobPostings = bundleIcon(NotePin20Filled, NotePin20Regular)

export const IdeaNav: FC = () => {
  const context = useIdeaModuleContext()
  const { getSelectedIdea, isOpen, renderHamburger } = useIdeaModule()

  return (
    <NavDrawer
      defaultSelectedValue={context.state.selectedIdea?.item.Id.toString()}
      // selectedCategoryValue={state.selectedIdea?.item.processing ? 'behandlingIdeer' : 'registreringIdeer'}
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
            {context.state.ideas.data.items
              .filter((idea) => !idea.processing)
              .map((idea) => (
                <NavSubItem
                  key={idea.Id.toString()}
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
            {context.state.ideas.data.items
              .filter((idea) => idea.processing)
              .map((idea) => (
                <NavSubItem
                  key={idea.Id.toString()}
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
  )
}
