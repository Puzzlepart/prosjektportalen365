declare interface IDeliveriesOverviewWebPartStrings {
  Title: string;
  LoadingText: string;
  NoGroupingText: string;
  SearchBoxLabelText: string;
  DeliveryDescriptionLabel: string;
  DeliveryStartTimeLabel: string;
  DeliveryEndTimeLabel: string;
  DeliveryStatusLabel: string;
  DeliveryStatusCommentLabel: string;
}

declare module 'DeliveriesOverviewWebPartStrings' {
  const strings: IDeliveriesOverviewWebPartStrings;
  export = strings;
}
