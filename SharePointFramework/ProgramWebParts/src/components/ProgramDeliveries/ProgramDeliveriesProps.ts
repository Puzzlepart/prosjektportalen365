import { DataAdapter } from 'data'
import { IAggregatedPortfolioPropertyPane } from 'models'

export interface IProgramDeliveriesProps {
  title: string
  context: any
  dataAdapter: DataAdapter
  properties: IAggregatedPortfolioPropertyPane
  onUpdateProperty: (key: string, value: any) => void
  childProjects?: string[]
}

// export const DeliveriesColumns = {
//     columns: [
//       {
//         key: "Title",
//         fieldName: "Title",
//         name: "Tittel",
//         minWidth: 220,
//         maxWidth: 250,
//         isMultiline: true,
//         isResizable: true
//       },
//       {
//         key: "GtDeliveryDescriptionOWSMTXT",
//         fieldName: "GtDeliveryDescriptionOWSMTXT",
//         name: "Leveransebeskrivelse",
//         minWidth: 220,
//         maxWidth: 220,
//         isMultiline: true,
//         isResizable: true
//       },
//       {
//         key: "GtDeliveryStartTimeOWSDATE",
//         fieldName: "GtDeliveryStartTimeOWSDATE",
//         name: "Starttidspunkt",
//         minWidth: 100,
//         maxWidth: 150,
//         isResizable: true,
//         data: { "renderAs": "date" }
//       },
//       {
//         key: "GtDeliveryEndTimeOWSDATE",
//         fieldName: "GtDeliveryEndTimeOWSDATE",
//         name: "Sluttidspunkt",
//         minWidth: 100,
//         maxWidth: 150,
//         isResizable: true,
//         data: { "renderAs": "date" }
//       },
//       {
//         key: "GtDeliveryStatusOWSCHCS",
//         fieldName: "GtDeliveryStatusOWSCHCS",
//         name: "Leveransestatus",
//         minWidth: 100,
//         maxWidth: 150,
//         isResizable: true
//       },
//       {
//         key: "GtDeliveryStatusCommentOWSMTXT",
//         fieldName: "GtDeliveryStatusCommentOWSMTXT",
//         name: "Kommentar, leveransestatus",
//         minWidth: 220,
//         maxWidth: 220,
//         isMultiline: true,
//         isResizable: true
//       }
//     ]
//   }