/**
 * The id of the setup extension (`ProjectSetup` in ProjectExtensions) that «Kjør oppsettveiviser»
 * and «Gjør om til overordnet prosjekt» add to the site as a custom action: the `main` channel's,
 * as in the site script that puts the setup on a new site, on a site in any language. A site in
 * another language than Norwegian got the `i18n` channel's id, which no release installs, so the
 * setup never started there. A channel build does not swap ids in TypeScript: on another channel
 * the dialogs start the `main` channel's setup.
 */
export const PROJECT_SETUP_COMPONENT_ID = 'ce34553d-ab47-4107-8dd1-e980d953996d'
