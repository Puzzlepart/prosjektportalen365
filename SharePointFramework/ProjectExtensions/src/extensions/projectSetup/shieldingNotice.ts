import { format } from 'pp365-shared-library'
import * as strings from 'ProjectExtensionsStrings'
import resource from 'SharedResources'

/** What the setup tells in a message: a title, and a text in Markdown. */
export interface ISetupNotice {
  title: string
  text: string
}

/**
 * A hub list by its title, linked to the list when the hub's address is known.
 *
 * @param title The list's title
 * @param hubUrl The hub's address
 * @param listUrl The list's address within the hub
 * @param view The view to open, with its query
 */
function listLink(title: string, hubUrl: string | undefined, listUrl: string, view = ''): string {
  if (!hubUrl) return `**${title}**`
  return `**[${title}](${hubUrl.replace(/\/+$/, '')}/${listUrl}${view})**`
}

/**
 * What a project that is set up already keeps on the hub when it gets an extension that shields
 * it. The setup moves and removes nothing, so it says what stays there, readable by everyone who
 * reads the hub, and what follows from leaving it. Each list is linked, and the two that name the
 * project by its site ID are filtered on it, so whoever may write to the hub can remove what
 * should not stay.
 *
 * @param hubUrl The hub's address; without it the lists are named, not linked
 * @param siteId The project's site ID
 */
export function getShieldingNotice(hubUrl: string | undefined, siteId: string): ISetupNotice {
  const allItems = '/AllItems.aspx'
  const ofProject = `${allItems}?FilterField1=GtSiteId&FilterValue1=${encodeURIComponent(
    siteId
  )}&FilterType1=Text`
  const items = [
    format(
      strings.ShieldingExistingProjectEntryText,
      listLink(resource.Lists_Projects_Title, hubUrl, resource.Lists_Projects_Url, ofProject)
    ),
    format(
      strings.ShieldingExistingProjectReportsText,
      listLink(
        resource.Lists_ProjectStatus_Title,
        hubUrl,
        resource.Lists_ProjectStatus_Url,
        ofProject
      ),
      listLink(
        resource.Lists_ProjectStatusAttachments_Title,
        hubUrl,
        resource.Lists_ProjectStatusAttachments_Url
      )
    ),
    format(
      strings.ShieldingExistingProjectTimelineText,
      listLink(
        resource.Lists_TimelineContent_Title,
        hubUrl,
        resource.Lists_TimelineContent_Url,
        allItems
      )
    ),
    format(
      strings.ShieldingExistingProjectArchiveLogText,
      listLink(resource.Lists_ArchiveLog_Title, hubUrl, resource.Lists_ArchiveLog_Url, allItems)
    )
  ]
  return {
    title: strings.ShieldingExistingProjectTitle,
    text: [
      strings.ShieldingExistingProjectIntroText,
      items.map((item) => `- ${item}`).join('\n'),
      strings.ShieldingExistingProjectOutroText
    ].join('\n\n')
  }
}
