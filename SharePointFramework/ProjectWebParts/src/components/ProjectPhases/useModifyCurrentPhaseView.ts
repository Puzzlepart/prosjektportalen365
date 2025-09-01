import { useContext } from 'react'
import { ProjectPhasesContext } from './context'
import resources from 'SharedResources'

/**
 * Hook for modifying the current phase view to only show documents for the current phase.
 *
 * @returns A function that can be called to modify the current phase view.
 */
export function useModifyCurrentPhaseView() {
  const { props, state } = useContext(ProjectPhasesContext)
  return async () => {
    const documentsViews = props.sp.web.lists.getByTitle(resources.Lists_Documents_Title).views
    const [documentsFrontpageView] = await documentsViews
      .select('Id', 'ViewQuery')
      .filter(`Title eq '${props.currentPhaseViewName}'`)<{ Id: string; ViewQuery: string }[]>()
    if (!documentsFrontpageView) return
    const viewQueryDom = new DOMParser().parseFromString(
      `<Query> ${documentsFrontpageView.ViewQuery}</Query> `,
      'text/xml'
    )
    const orderByDomElement = viewQueryDom.getElementsByTagName('OrderBy')[0]
    const orderBy = orderByDomElement ? orderByDomElement.outerHTML : ''
    const newViewQuery = [
      orderBy,
      `<Where><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${state.confirmPhase.name}</Value></Eq></Where>`
    ].join('')
    try {
      await documentsViews.getById(documentsFrontpageView.Id).update({ ViewQuery: newViewQuery })
    } catch (err) {}
  }
}
