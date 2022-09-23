declare interface IPortfolioExtensionsStrings {
  SetRecommendationTitle: string
  SetRecommendationSubtitle: string
  IdeaProjectDataDialogTitle: string
  IdeaProjectDataDialogInfoText: string
  IdeaProcessorsSiteGroup: string
  IdeaProcessingTitle: string
  IdeaProcessingUrlTitle: string
  IdeaRegistrationTitle: string
  IdeaRegistrationUrlTitle: string
  ApproveChoice: string
  ConsiderationChoice: string
  RejectChoice: string
  ApprovedSyncText: string
  ApprovedText: string
  ConsiderationText: string
  RejectedText: string
  IdeaAlreadyApproved: string
  ActionLabel: string
  ActionLabelPlaceholder: string
  CommentLabel: string
  CommentLabelPlaceholder: string
  CancelLabel: string
  SubmitLabel: string
}

declare module 'PortfolioExtensionsStrings' {
  const strings: IPortfolioExtensionsStrings;
  export = strings;
}
