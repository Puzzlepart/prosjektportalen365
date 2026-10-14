# Issue #1319, the visual upgrade's last two components

Status: agreed 2026-10-14. Branch: `fix/1319-visual-upgrade-leftovers` off `releases/1.15`, one
pull request, squash-merged; the issue is closed when the merge is on the test channel and the
hand round is done (the user's decision 1).

[#1319](https://github.com/Puzzlepart/prosjektportalen365/issues/1319) is the second half of the
visual upgrade (#1132, closed 2023-11-30): every component converted to Fluent UI and the house
rules. Two boxes are open, `Document Template dialog` and `Risk Action`. Both were converted to
Fluent UI v9 in the 1.15 migration (`fluent-v9-migration.md`, `fluent-v9-phase-4.md`), so what is
left is the migration's leftovers, not the upgrade.

## What the code and the tenant say (2026-10-14)

- **`DocumentTemplateDialog`** (ProjectExtensions, «Hent dokumentmal»): `@BaseDialog` (v9
  `Dialog`), `DataGridList`, v9 `Breadcrumb`, `UserMessage`, `Field` + `ProgressBar`. Jest:
  `SelectScreen`, `TargetFolderScreen`, `DocumentTemplateItem`, `reducer`. Browser:
  `e2e/tests/smoke/document-template-dialog.spec.ts`, `e2e/tests/flows/document-template-copy.spec.ts`,
  which find the buttons by name. Leftovers: the Select and Summary screens put their buttons in
  the dialog's footer (`BaseDialog`'s `footer`), while `TargetFolderScreen` and `EditCopyScreen`
  render their own `DialogActions` at the bottom of the content, so the buttons move between
  screens; the component lives in `index.tsx` with its logic inside (no hook, `types.tsx`), the
  shape kodemonster.md says not to copy. `@fluentui/react-file-type-icons` (v8 family) only names
  the icon image on the CDN (`FileTypeIcon`) and lends two types; it renders no v8 UI and stays.
- **`RiskAction`** (ProjectExtensions, the field customizer on `GtRiskAction` with Planner): v9
  `Popover`, `Dialog`, `BasePanel`, `Combobox`, `Persona`. Jest: `RiskAction.test.tsx` (9),
  `extensions/riskAction/riskAction.test.tsx` (3). No browser test. Leftovers:
  - `Alert` from `@fluentui/react-components/unstable` in `RiskActionPopover.tsx`,
    `RiskActionFieldValue.tsx` and `MigrateRiskActionsDialog.tsx`: `@fluentui/react-alert`
    9.0.2-beta.1, which Fluent deprecated for `MessageBar` (the installed re-export carries
    `no-deprecated` disables). The migration left it because it compiles.
  - `NewRiskActionPanel.tsx` and its `Footer.tsx` nest `IdPrefixProvider` + `FluentProvider`
    inside `BasePanel`, which has its own (pp365-ui lists the panel among the leftovers).
  - `MigrateRiskActionsDialog.tsx`: the close button's `aria-label='close'` is hard-coded English
    (1.15 fixed the same defect in the other dialogs: «Lukk» from `CloseModalText`), and its
    buttons sit in `DialogContent` instead of `DialogActions`.
  - The dates are `Input type='date'` (the browser's), not the `DatePicker` the other forms use;
    the responsible is a freeform `Combobox` with a `Persona` showing an «unknown» presence badge,
    not the shared `PeoplePicker`.
  - Each cell is its own React root, so each row has its own `FluentProvider`. That is how a field
    customizer works and is left as is.
- **The test hub** (`sites/pp365-test`, read 2026-10-14): `RiskActionPlannerEnabled` = 1, bucket
  «Tiltak», `RiskActionPlannerNoActionsText` set, `ShowLastSyncTime` = 1, `HorizontalLayout` = 0,
  `Gap` = 2px. **The e2e project** (`E2E_PROJECT_URL`): list «Usikkerhet», 8 items, `GtRiskAction`
  in the default view «Alle elementer» (`Lists/Usikkerhet/AllItems.aspx`), the field bound to the
  test channel's `RiskActionPlanner` id (`channels/test.json`), the hidden `RiskActionData` and
  `RiskActionUpdated` present and empty on every item: every row shows its text, and the popover
  offers «Legg til» and «Migrer», never «Synkroniser». The site has a Microsoft 365 group;
  `package-solution.json` asks for `Group.ReadWrite.All` and `User.Read.All`, so a signed-in user
  can write Planner tasks. Nothing in the harness can delete a Planner task afterwards.
- **Reuse available in the library:** `CustomEditPanel`'s field elements are bound to
  `EditableSPField`, so the panel takes their building blocks, not the elements: `FieldContainer`
  with `Input` (`Text.tsx`), `Textarea` (`Note.tsx`), `Switch` (`Boolean.tsx`), `PeoplePicker`
  (`User.tsx`) and the localized `DatePicker` of `DateTime.tsx` (`formatDay`, `parseShortDate`,
  `getDatePickerLocalization`, `useFieldControlProps_unstable`, a `mountNode` div so the popup
  escapes the drawer). `IPersonaItem.secondaryText` is the email, which the data adapter's
  `_getUserId(mail)` already takes; `DataAdapter` extends `SPDataAdapterBase`, so
  `clientPeoplePickerSearchUser` serves `onResolveSuggestions`.

## Decisions (the user, 2026-10-14)

- **D1.** Close the issue when the work is merged and on the test channel, not before.
- **D2.** The dialog's buttons gather in its footer on every screen, and the folder is
  restructured to kodemonster.md's shape in the same change.
- **D3.** The new-action panel follows the other panels (drawers on `BasePanel`), and its fields
  match the ones already built: `FieldContainer` with the library's controls, the shared
  `DatePicker` field and `PeoplePicker`. What is unique to the panel and cannot be reused goes:
  `ResponsibleField`, `Footer`, the nested providers.
- **D4.** Testing of the Planner actions comes in: a read-only browser smoke now, writes stay in
  Jest and the hand round until the harness can delete a Planner task (parked, see slice 4).

## Slices and order

| # | Slice | Scope | Effort | Exit |
|---|---|---|---|---|
| 1 | Risk action leftovers | `Alert` → v9 `MessageBar` in the three files (not `UserMessage`: it carries a provider, and the cell renders per row); the nested providers out of the panel and its footer; the migrate dialog's close button named from `CloseModalText` and its buttons in `DialogActions`. A test that the close button is «Lukk», seen failing first; the 12 tests green | ½ day | `[apps-only:ProjectExtensions]`; hand round on a risk list with Planner on |
| 2 | The shared date field and the new-action panel | shared-library: the picker of `DateTime.tsx` becomes a shared field component (`FieldContainer` + localized `DatePicker`, the `mountNode` div), `DateTime.tsx` renders it (its two tests unchanged). ProjectExtensions: `NewRiskActionPanel` = `BasePanel` with `headerText`, content of `FieldContainer` + `Input` (title, required), `Textarea`, the shared date field ×2, `PeoplePicker` (single; the model keeps the person's email), `Switch`; `footer` with save (disabled without a title or while saving) and cancel. `ResponsibleField/` and `Footer/` deleted, unused strings out of the triad (`validate-loc`). `RiskAction.test.tsx`: the `Combobox` stand-in gives way to the people picker as `UserFields.test.tsx` drives it; dates picked through the picker | 1 day | `[apps-only]` (the library changed); hand round: add an action with responsible and dates, see it in Planner |
| 3 | Document template dialog | The footer belongs to the dialog: the screens hand it their buttons (through the dialog's context, or their state lifted to the reducer; decided when written, with reducer tests for new actions). Folder to convention: `index.ts` barrel, `DocumentTemplateDialog.tsx`, `useDocumentTemplateDialog.ts` (state, `onStartCopy`, `onClose`), `types.ts`; each screen likewise with a hook where it has logic. `components/index.ts` keeps exporting the dialog and its types. Existing Jest and the two browser specs green | 1 day | `[apps-only:ProjectExtensions]`; hand round: select, target folder, rename, copy, summary |
| 4 | Browser smoke for the risk actions | `e2e/tests/smoke/risk-action.spec.ts`, read-only on `E2E_PROJECT_URL`: the list's default view (resolved through `_api/web/lists/getbytitle('Usikkerhet')`, skipped when missing), every `GtRiskAction` cell rendered by the customizer with the item's text, a cell's popover with its title and the add and migrate buttons, the panel's drawer with its five labels, the migrate dialog listing the lines, each closed again. `testoversikt.md` moves «Planner-tiltak» out of «Bare Jest». Parked: a flow that adds a task, synchronises and cleans up, once the harness can delete the Planner task (the CI app has no Planner permission; the UI has no delete) | ½ day | goes with slice 3's run (`[apps-only:ProjectExtensions]` runs e2e); green in CI |
| 5 | Close-out | `CHANGELOG.md` 1.15.0: under Forbedringer the panel's date and people pickers and the dialog's footer; under Feilrettinger the migrate dialog's close button, next to the line for the other dialogs. pp365-ui: `NewRiskActionPanel` off the nested-provider list, the date-picker note updated to the shared field. The slice log below; the issue's two boxes checked with the commits linked; closed per D1 | small | #1319 closed |

Order 1, 2, 3 (4 with it), 5. Slice 1 and 3 touch only ProjectExtensions; slice 2 changes the
library, so its run deploys every package.

## Rules for the executing agent

- Read `AGENTS.md`, the `pp365-ui`, `pp365-testing` and `pp365-release` skills and this plan
  before the first edit. The developer runs git and the builds; each batch ends with a commit
  message, and the subject's tag is the one above. Never a bare `[skip-ci]` on code.
- Tests first; a test that pins behaviour is seen green on the old code. Jest never imports
  `@pnp/*`; `jest.mock` precedes the imports. A missed coverage floor is raised, never lowered.
- No provider inside a shared wrapper; strings from the loc triad only; identifiers in English.
- The browser smoke writes nothing. Nothing in this plan touches the Planner data of any site.

## Risks

- The `DatePicker` popup in a drawer: the drawer's transform makes it the containing block of
  fixed elements, which is what `DateTime.tsx`'s `mountNode` div exists for; keep it in the shared
  field, and check the panel by hand on the tenant.
- A single `PeoplePicker` hides its input once someone is picked; the responsible is replaced by
  removing the person first, as the other forms do.
- Restructuring the dialog moves files the two browser specs and four Jest files know only by
  behaviour; the barrel keeps the exports, and the specs are the regression net.
- The field customizer only renders when `RiskActionPlannerEnabled` is 1 on the hub; the smoke
  asserts it, since the test hub has it on, so a changed setting fails the test rather than skips.

## Definition of done

Slices 1 to 4 merged to `releases/1.15` and green on the test channel, the hand rounds done, the
changelog and the skill updated, #1319 closed with the two boxes checked.

## Slice log

### Slice 1 — Risk action leftovers (2026-10-14)

Done as planned. The three `Alert`s from `@fluentui/react-components/unstable` are v9
`MessageBar`s with a `MessageBarBody`; since the body sets its own typography, each module's
`.alert`/`.infoText` class now nests `:global(.fui-MessageBarBody)` with `font-size: inherit` so
the cell (10px), the popover (12px) and the migrate dialog (12px) keep their sizes. The migrate
dialog's close button is named from `CloseModalText` («Lukk»), and its two buttons moved from a
`div.actions` in `DialogContent` to a `DialogActions` under `DialogBody`, rendered only while no
migration runs (the progress bar stays in the content). `NewRiskActionPanel` and `Footer` lost their
`IdPrefixProvider` + `FluentProvider` (a `div` keeps each module class); `useNewRiskActionPanel`
no longer returns `fluentProviderId`. The root `RiskAction` keeps its provider: each cell is its own
React root.

Tests first: «names the migrate dialog's close button for screen readers» (`getByLabelText(Lukk)`)
and «renders the new-action panel under the drawer's provider alone» (no `.fui-FluentProvider`
inside the drawer's `role=dialog`) were seen failing on the old code, then green; `RiskAction.test`
has 11 tests, the folder's 14 pass, lint has no warning in the changed files. Changelog: a
Forbedringer line for the message bars and the dialog's button row, and the migrate dialog added to
the 1.15 line about the close buttons. pp365-ui no longer lists the panel among the nested
providers. Hand round pending (the user): a risk list with Planner on, the popover, the panel, the
migrate dialog and the synchronisation.

### Slice 2 — The shared date field and the new-action panel (2026-10-14)

Done as planned. **shared-library:** `components/DateField` (`DateField.tsx`, `useDateField.ts`,
`types.ts`, barrel) is the picker that lived in `CustomEditPanel`'s `DateTime.tsx`: a
`FieldContainer` (icon `Calendar` by default) around Fluent's `DatePicker` with
`getDatePickerLocalization`, `formatDay`/`parseShortDate`, week numbers, typed input, the field's id
through `useFieldControlProps_unstable` so the label reaches the picker, and the calendar mounted in
the field's own absolutely placed element so a drawer's transform and overflow leave it alone. Its
props carry no `null` (`@rushstack/no-new-null`): `value?: Date`, `onSelectDate(date: Date |
undefined)`, the picker's `null` for a cleared day mapped to `undefined`, the popup element's ref
a `RefCallback`. `DateTime.tsx` renders it with the field's label, description, required flag and
model value; its two tests passed unchanged, and `DateField.test.tsx` (3) pins the label tie, the
day, the placeholder, the mount node, the short form and the pick. Exported from the components
barrel.

**ProjectExtensions:** `NewRiskActionPanel` is `BasePanel` with `headerText` and a `footer` of
save and cancel; its content is `FieldContainer` + `Input` (title, required, controlled),
`Textarea`, two `DateField`s, `FieldContainer` + the shared `PeoplePicker` (single; the person's
email goes to the adapter as before), `Switch`. `ResponsibleField/` and `Footer/` are deleted, and
`ResponsibleFieldNoResults` left the loc triad (`validate-loc`: 0 missing). The hook holds a typed
form (`INewRiskActionForm`), builds the adapter's `Map` on save (`toTaskModel`), and after a save
with «create several» on clears the form but keeps the switch, where the old uncontrolled inputs
kept the last task's text. The days reach Planner as `Date`s, which the request serialises as ISO
instants at local midnight; the old `Input type='date'` sent a bare day that Graph read as UTC.

Tests: `RiskAction.test.tsx` drives the responsible through the harness's TagPicker stand-in
(composed with the file's own popover and dropdown stand-ins) and the days through an input
stand-in for the picker that keeps `formatDate`/`parseDateFromString`/`onSelectDate`; the add test
asserts title, both days and the email in the adapter's model, the no-results test the shared
picker's text (a literal, since the solution has no typings for `SharedLibraryStrings`), and the
«one after another» test that the form clears. 11 pass, the folder's 14, the library's 6; lint
clean. The changelog has a Forbedringer line; pp365-ui got a `DateField` row and the form-field
bullet now points to it. Hand round pending (the user): add a task with days and a responsible from
the risk list, see it in Planner with the dates and assignee; a date typed as «15.03.2026»; the
calendar opening inside the drawer without being clipped.
