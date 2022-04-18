[madwizard](README.md) / Exports

# madwizard

## Table of contents

### Interfaces

- [ChoiceState](interfaces/ChoiceState.md)
- [Ordered](interfaces/Ordered.md)
- [TabProps](interfaces/TabProps.md)
- [Tile](interfaces/Tile.md)
- [WizardStep](interfaces/WizardStep.md)

### Type aliases

- [Choice](modules.md#choice)
- [ChoicePart](modules.md#choicepart)
- [Choices](modules.md#choices)
- [ChoicesMap](modules.md#choicesmap)
- [Graph](modules.md#graph)
- [OrderedChoice](modules.md#orderedchoice)
- [OrderedCodeBlock](modules.md#orderedcodeblock)
- [OrderedGraph](modules.md#orderedgraph)
- [OrderedParallel](modules.md#orderedparallel)
- [OrderedSequence](modules.md#orderedsequence)
- [OrderedSubTask](modules.md#orderedsubtask)
- [OrderedTitledSteps](modules.md#orderedtitledsteps)
- [Parallel](modules.md#parallel)
- [Sequence](modules.md#sequence)
- [Status](modules.md#status)
- [SubTask](modules.md#subtask)
- [TitledStep](modules.md#titledstep)
- [TitledSteps](modules.md#titledsteps)
- [Unordered](modules.md#unordered)
- [ValidationExecutor](modules.md#validationexecutor)
- [Wizard](modules.md#wizard)

### Variables

- [END_OF_TAB](modules.md#end_of_tab)
- [END_OF_TIP](modules.md#end_of_tip)
- [PUSH_TABS](modules.md#push_tabs)
- [START_OF_TAB](modules.md#start_of_tab)
- [START_OF_TIP](modules.md#start_of_tip)

### Functions

- [asSubTask](modules.md#assubtask)
- [blockify](modules.md#blockify)
- [blocks](modules.md#blocks)
- [bodySource](modules.md#bodysource)
- [choose](modules.md#choose)
- [chooseIndex](modules.md#chooseindex)
- [compile](modules.md#compile)
- [default](modules.md#default)
- [emptySequence](modules.md#emptysequence)
- [extractDescription](modules.md#extractdescription)
- [extractTitle](modules.md#extracttitle)
- [findChoiceFrontier](modules.md#findchoicefrontier)
- [findCodeBlockFrontier](modules.md#findcodeblockfrontier)
- [findPrereqsAndMainTasks](modules.md#findprereqsandmaintasks)
- [getTabTitle](modules.md#gettabtitle)
- [getTabsDepth](modules.md#gettabsdepth)
- [getTipTitle](modules.md#gettiptitle)
- [hackMarkdownSource](modules.md#hackmarkdownsource)
- [hasFilepath](modules.md#hasfilepath)
- [hasKey](modules.md#haskey)
- [hasSource](modules.md#hassource)
- [hasTitle](modules.md#hastitle)
- [hasTitleProperty](modules.md#hastitleproperty)
- [isChoice](modules.md#ischoice)
- [isChoiceStep](modules.md#ischoicestep)
- [isEmpty](modules.md#isempty)
- [isLeafNode](modules.md#isleafnode)
- [isMarkdownStep](modules.md#ismarkdownstep)
- [isParallel](modules.md#isparallel)
- [isSequence](modules.md#issequence)
- [isStatus](modules.md#isstatus)
- [isSubTask](modules.md#issubtask)
- [isTab](modules.md#istab)
- [isTabGroup](modules.md#istabgroup)
- [isTabWithProperties](modules.md#istabwithproperties)
- [isTabs](modules.md#istabs)
- [isTip](modules.md#istip)
- [isTipWithFullTitle](modules.md#istipwithfulltitle)
- [isTipWithoutFullTitle](modules.md#istipwithoutfulltitle)
- [isTitledSteps](modules.md#istitledsteps)
- [newChoiceState](modules.md#newchoicestate)
- [order](modules.md#order)
- [orderSubTask](modules.md#ordersubtask)
- [parallel](modules.md#parallel-1)
- [parse](modules.md#parse)
- [progress](modules.md#progress)
- [rehypeCodeIndexer](modules.md#rehypecodeindexer)
- [rehypeTabbed](modules.md#rehypetabbed)
- [rehypeTip](modules.md#rehypetip)
- [sameChoices](modules.md#samechoices)
- [sameGraph](modules.md#samegraph)
- [seq](modules.md#seq)
- [sequence](modules.md#sequence-1)
- [setTabGroup](modules.md#settabgroup)
- [setTabTitle](modules.md#settabtitle)
- [subtask](modules.md#subtask-1)
- [validate](modules.md#validate)
- [wizardify](modules.md#wizardify)

## Type aliases

### Choice

Ƭ **Choice**<`T`\>: `Source` & `T` & `Title` & { `choices`: [`ChoicePart`](modules.md#choicepart)<`T`\>[] ; `group`: `ChoiceGroup` }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:122](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L122)

---

### ChoicePart

Ƭ **ChoicePart**<`T`\>: `Title` & `Partial`<`Description`\> & { `graph`: [`Sequence`](modules.md#sequence)<`T`\> ; `member`: `ChoiceMember` }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:116](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L116)

---

### Choices

Ƭ **Choices**: `Object`

#### Type declaration

| Name      | Type                                       |
| :-------- | :----------------------------------------- |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) |

#### Defined in

[choices/index.ts:37](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L37)

---

### ChoicesMap

Ƭ **ChoicesMap**: `Record`<`CodeBlockChoice`[``"group"``], `CodeBlockChoice`[``"title"``]\>

#### Defined in

[choices/index.ts:22](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L22)

---

### Graph

Ƭ **Graph**<`T`\>: `InteriorNode`<`T`\> \| `LeafNode`<`T`\>

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:225](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L225)

---

### OrderedChoice

Ƭ **OrderedChoice**: [`Choice`](modules.md#choice)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:129](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L129)

---

### OrderedCodeBlock

Ƭ **OrderedCodeBlock**: `CodeBlockProps` & [`Ordered`](interfaces/Ordered.md)

#### Defined in

[graph/index.ts:229](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L229)

---

### OrderedGraph

Ƭ **OrderedGraph**: [`Graph`](modules.md#graph)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:227](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L227)

---

### OrderedParallel

Ƭ **OrderedParallel**: [`Parallel`](modules.md#parallel)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:144](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L144)

---

### OrderedSequence

Ƭ **OrderedSequence**: [`Sequence`](modules.md#sequence)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:63](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L63)

---

### OrderedSubTask

Ƭ **OrderedSubTask**: [`SubTask`](modules.md#subtask)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:182](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L182)

---

### OrderedTitledSteps

Ƭ **OrderedTitledSteps**: [`TitledSteps`](modules.md#titledsteps)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:76](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L76)

---

### Parallel

Ƭ **Parallel**<`T`\>: `T` & `Key` & { `parallel`: [`Graph`](modules.md#graph)<`T`\>[] }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:139](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L139)

---

### Sequence

Ƭ **Sequence**<`T`\>: `T` & `Key` & { `sequence`: [`Graph`](modules.md#graph)<`T`\>[] }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:58](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L58)

---

### Status

Ƭ **Status**: `"blank"` \| `"info"` \| `"minor"` \| `"current"` \| `"pending"` \| `"in-progress"` \| `"success"` \| `"warning"` \| `"error"` \| `"unknown"`

#### Defined in

[graph/Status.ts:17](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/Status.ts#L17)

---

### SubTask

Ƭ **SubTask**<`T`\>: `Key` & `Source` & `Filepath` & `Title` & `Partial`<`Description`\> & `T` & { `graph`: [`Sequence`](modules.md#sequence)<`T`\> }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:173](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L173)

---

### TitledStep

Ƭ **TitledStep**<`T`\>: `Source` & `Title` & `Partial`<`Description`\> & { `graph`: [`Sequence`](modules.md#sequence)<`T`\> }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:65](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L65)

---

### TitledSteps

Ƭ **TitledSteps**<`T`\>: `T` & `Source` & `Title` & `Partial`<`Description`\> & { `steps`: [`TitledStep`](modules.md#titledstep)<`T`\>[] }

#### Type parameters

| Name | Type                                                                                                                    |
| :--- | :---------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Unordered`](modules.md#unordered) \| [`Ordered`](interfaces/Ordered.md) = [`Unordered`](modules.md#unordered) |

#### Defined in

[graph/index.ts:69](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L69)

---

### Unordered

Ƭ **Unordered**: `Partial`<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/index.ts:56](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L56)

---

### ValidationExecutor

Ƭ **ValidationExecutor**: (`cmdline`: `string`) => `"success"` \| `Promise`<`"success"`\>

#### Type declaration

▸ (`cmdline`): `"success"` \| `Promise`<`"success"`\>

##### Parameters

| Name      | Type     |
| :-------- | :------- |
| `cmdline` | `string` |

##### Returns

`"success"` \| `Promise`<`"success"`\>

#### Defined in

[graph/validate.ts:19](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/validate.ts#L19)

---

### Wizard

Ƭ **Wizard**: `WizardStepWithGraph`[]

#### Defined in

[wizard/index.ts:88](https://github.com/starpit/madwizard/blob/7849c0f/src/wizard/index.ts#L88)

## Variables

### END_OF_TAB

• `Const` **END_OF_TAB**: `"<!-- ____KUI_END_OF_TAB____ -->"`

#### Defined in

[parser/rehype-tabbed/index.ts:29](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L29)

---

### END_OF_TIP

• `Const` **END_OF_TIP**: `"<!-- ____KUI_END_OF_TIP____ -->"`

#### Defined in

[parser/rehype-tip/index.ts:27](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L27)

---

### PUSH_TABS

• `Const` **PUSH_TABS**: `"<!-- ____KUI_NESTED_TABS____ -->"`

#### Defined in

[parser/rehype-tabbed/index.ts:28](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L28)

---

### START_OF_TAB

• `Const` **START_OF_TAB**: `"<!-- ____KUI_START_OF_TAB____ -->"`

#### Defined in

[parser/rehype-tabbed/index.ts:27](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L27)

---

### START_OF_TIP

• `Const` **START_OF_TIP**: `"<!-- ____KUI_START_OF_TIP____ -->"`

#### Defined in

[parser/rehype-tip/index.ts:26](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L26)

## Functions

### asSubTask

▸ **asSubTask**(`step`): [`SubTask`](modules.md#subtask)

#### Parameters

| Name   | Type                                                                                   |
| :----- | :------------------------------------------------------------------------------------- |
| `step` | [`TitledStep`](modules.md#titledstep)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

[`SubTask`](modules.md#subtask)

#### Defined in

[graph/index.ts:202](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L202)

---

### blockify

▸ **blockify**(`input`, `choices?`, `uuid?`): `Promise`<{ `ast`: `Promise`<`Root`\> ; `blocks`: `CodeBlockProps`[] ; `choices`: [`ChoiceState`](interfaces/ChoiceState.md) }\>

#### Parameters

| Name       | Type                                       |
| :--------- | :----------------------------------------- |
| `input`    | `string`                                   |
| `choices?` | [`ChoiceState`](interfaces/ChoiceState.md) |
| `uuid?`    | `string`                                   |

#### Returns

`Promise`<{ `ast`: `Promise`<`Root`\> ; `blocks`: `CodeBlockProps`[] ; `choices`: [`ChoiceState`](interfaces/ChoiceState.md) }\>

#### Defined in

[parser/index.ts:102](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/index.ts#L102)

---

### blocks

▸ **blocks**<`T`\>(`graph`, `choices?`): `CodeBlockProps` & `T`[]

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name      | Type                                                                      | Default value    |
| :-------- | :------------------------------------------------------------------------ | :--------------- |
| `graph`   | [`Graph`](modules.md#graph)<`T`\>                                         | `undefined`      |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) \| `"default-path"` \| `"all"` | `"default-path"` |

#### Returns

`CodeBlockProps` & `T`[]

A linearized set of code blocks in the given `graph`

#### Defined in

[graph/linearize.ts:34](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/linearize.ts#L34)

---

### bodySource

▸ **bodySource**(`graph`): `string`

#### Parameters

| Name    | Type                                                        |
| :------ | :---------------------------------------------------------- |
| `graph` | `LeafNode`<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

`string`

#### Defined in

[graph/index.ts:316](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L316)

---

### choose

▸ **choose**<`T`\>(`graph`, `choices?`): [`Graph`](modules.md#graph)<`T`\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name      | Type                                                           | Default value    |
| :-------- | :------------------------------------------------------------- | :--------------- |
| `graph`   | [`Choice`](modules.md#choice)<`T`\>                            | `undefined`      |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) \| `"default-path"` | `"default-path"` |

#### Returns

[`Graph`](modules.md#graph)<`T`\>

the current choice, which defaults to the first if we are
not provided a set of user choices via the `choices` parameter. The
decision to default to the first choice stems from a common origin
UI, of presenting choices in a set of tabs; in a tabular UI,
usually the first tab is open by default.

#### Defined in

[graph/index.ts:309](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L309)

---

### chooseIndex

▸ **chooseIndex**(`graph`, `choices?`): `number`

#### Parameters

| Name      | Type                                                                           | Default value    |
| :-------- | :----------------------------------------------------------------------------- | :--------------- |
| `graph`   | [`Choice`](modules.md#choice)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> | `undefined`      |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) \| `"default-path"`                 | `"default-path"` |

#### Returns

`number`

the current choice index, which defaults to the first if we
are not provided a set of user choices via the `choices`
parameter. The decision to default to the first choice stems from a
common origin UI, of presenting choices in a set of tabs; in a
tabular UI, usually the first tab is open by default.

#### Defined in

[graph/index.ts:295](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L295)

---

### compile

▸ **compile**(`blocks`, `choices`, `ordering?`): [`Graph`](modules.md#graph)

Take a list of code blocks and arrange them into a control flow dag

#### Parameters

| Name       | Type                                       | Default value |
| :--------- | :----------------------------------------- | :------------ |
| `blocks`   | `CodeBlockProps`[]                         | `undefined`   |
| `choices`  | [`ChoiceState`](interfaces/ChoiceState.md) | `undefined`   |
| `ordering` | `"sequence"` \| `"parallel"`               | `"sequence"`  |

#### Returns

[`Graph`](modules.md#graph)

#### Defined in

[graph/compile.ts:54](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/compile.ts#L54)

---

### default

▸ **default**(`input`, `choices?`): `Promise`<{ `blocks`: `CodeBlockProps`[] ; `choices`: [`ChoiceState`](interfaces/ChoiceState.md) ; `dag`: [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> ; `wizard`: [`Wizard`](modules.md#wizard) }\>

#### Parameters

| Name      | Type                                       |
| :-------- | :----------------------------------------- |
| `input`   | `string`                                   |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) |

#### Returns

`Promise`<{ `blocks`: `CodeBlockProps`[] ; `choices`: [`ChoiceState`](interfaces/ChoiceState.md) ; `dag`: [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> ; `wizard`: [`Wizard`](modules.md#wizard) }\>

#### Defined in

[index.ts:27](https://github.com/starpit/madwizard/blob/7849c0f/src/index.ts#L27)

---

### emptySequence

▸ **emptySequence**(): [`Sequence`](modules.md#sequence)

#### Returns

[`Sequence`](modules.md#sequence)

#### Defined in

[graph/index.ts:97](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L97)

---

### extractDescription

▸ **extractDescription**(`graph`): `string`

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

`string`

#### Defined in

[graph/index.ts:361](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L361)

---

### extractTitle

▸ **extractTitle**(`graph`): `any`

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

`any`

#### Defined in

[graph/index.ts:342](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L342)

---

### findChoiceFrontier

▸ **findChoiceFrontier**(`graph`, `choices`, `prereqs?`, `marks?`): { `choice`: [`Choice`](modules.md#choice) ; `prereqs?`: [`Graph`](modules.md#graph)[] }[]

Find the first set of `Choice` nodes, when scanning the given
`graph`. Do not scan under Choice nodes for nested
choices... unless the user has already made a choice (according to
the given `ChoiceState`) for that choice; in which case, we tunnel
through under that branch, looking for the next choice...

#### Parameters

| Name      | Type                                                                           | Default value |
| :-------- | :----------------------------------------------------------------------------- | :------------ |
| `graph`   | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\>   | `undefined`   |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md)                                     | `undefined`   |
| `prereqs` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\>[] | `[]`          |
| `marks`   | `Record`<`string`, `boolean`\>                                                 | `{}`          |

#### Returns

{ `choice`: [`Choice`](modules.md#choice) ; `prereqs?`: [`Graph`](modules.md#graph)[] }[]

#### Defined in

[graph/choice-frontier.ts:116](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/choice-frontier.ts#L116)

---

### findCodeBlockFrontier

▸ **findCodeBlockFrontier**(`graph`, `choices`): [`Graph`](modules.md#graph)[]

Find the first set of `CodeBlock` nodes, when scanning the given
`graph`. Do not scan under Choice nodes for nested subtasks, unless
the user has already indicated a selection for that choice.

#### Parameters

| Name      | Type                                                                         |
| :-------- | :--------------------------------------------------------------------------- |
| `graph`   | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md)                                   |

#### Returns

[`Graph`](modules.md#graph)[]

#### Defined in

[graph/choice-frontier.ts:55](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/choice-frontier.ts#L55)

---

### findPrereqsAndMainTasks

▸ **findPrereqsAndMainTasks**(`graph`): [`Graph`](modules.md#graph)[]

Enumerate the Prerequisites and Main Tasks in the given `graph.

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

[`Graph`](modules.md#graph)[]

#### Defined in

[graph/choice-frontier.ts:84](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/choice-frontier.ts#L84)

---

### getTabTitle

▸ **getTabTitle**(`elt`): `string`

#### Parameters

| Name  | Type      |
| :---- | :-------- |
| `elt` | `Element` |

#### Returns

`string`

#### Defined in

[parser/rehype-tabbed/index.ts:65](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L65)

---

### getTabsDepth

▸ **getTabsDepth**(`props`): `number`

#### Parameters

| Name    | Type                                 |
| :------ | :----------------------------------- |
| `props` | [`TabProps`](interfaces/TabProps.md) |

#### Returns

`number`

#### Defined in

[parser/rehype-tabbed/index.ts:37](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L37)

---

### getTipTitle

▸ **getTipTitle**(`elt`): `string`

#### Parameters

| Name  | Type      |
| :---- | :-------- |
| `elt` | `Element` |

#### Returns

`string`

#### Defined in

[parser/rehype-tip/index.ts:33](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L33)

---

### hackMarkdownSource

▸ **hackMarkdownSource**(`source`): `string`

#### Parameters

| Name     | Type     |
| :------- | :------- |
| `source` | `string` |

#### Returns

`string`

#### Defined in

[parser/hack.ts:26](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/hack.ts#L26)

---

### hasFilepath

▸ **hasFilepath**(`graph`): graph is Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Filepath & Partial<Ordered\> & Key & Object & Filepath & Partial<Ordered\> & Key & Object & Filepath & Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Filepath & CodeBlockProps & Partial<Ordered\> & Filepath

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

graph is Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Filepath & Partial<Ordered\> & Key & Object & Filepath & Partial<Ordered\> & Key & Object & Filepath & Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Filepath & CodeBlockProps & Partial<Ordered\> & Filepath

#### Defined in

[graph/index.ts:330](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L330)

---

### hasKey

▸ **hasKey**(`graph`): graph is Partial<Ordered\> & Key & Object & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Key & Partial<Ordered\> & Key & Object & Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Key & CodeBlockProps & Partial<Ordered\> & Key

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

graph is Partial<Ordered\> & Key & Object & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Key & Partial<Ordered\> & Key & Object & Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Key & CodeBlockProps & Partial<Ordered\> & Key

#### Defined in

[graph/index.ts:326](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L326)

---

### hasSource

▸ **hasSource**(`graph`): graph is Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Source & Partial<Ordered\> & Title & Object & Partial<Ordered\> & Key & Object & Source & Partial<Ordered\> & Key & Object & Source & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & CodeBlockProps & Partial<Ordered\> & Source

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

graph is Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Source & Partial<Ordered\> & Title & Object & Partial<Ordered\> & Key & Object & Source & Partial<Ordered\> & Key & Object & Source & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & CodeBlockProps & Partial<Ordered\> & Source

#### Defined in

[graph/index.ts:322](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L322)

---

### hasTitle

▸ **hasTitle**(`graph`): graph is Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & CodeBlockProps & Partial<Ordered\> & Title & Partial<Description\>

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

graph is Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & CodeBlockProps & Partial<Ordered\> & Title & Partial<Description\>

#### Defined in

[graph/index.ts:338](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L338)

---

### hasTitleProperty

▸ **hasTitleProperty**(`graph`): graph is Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & CodeBlockProps & Partial<Ordered\> & Title & Partial<Description\>

#### Parameters

| Name    | Type                                                                         |
| :------ | :--------------------------------------------------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

graph is Partial<Ordered\> & Source & Title & Partial<Description\> & Object & Key & Source & Filepath & Title & Partial<Description\> & Partial<Ordered\> & Object & Source & Partial<Ordered\> & Title & Object & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & Partial<Ordered\> & Key & Object & Title & Partial<Description\> & CodeBlockProps & Partial<Ordered\> & Title & Partial<Description\>

#### Defined in

[graph/index.ts:334](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L334)

---

### isChoice

▸ **isChoice**<`T`\>(`graph`): graph is Choice<T\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`T`\> |

#### Returns

graph is Choice<T\>

#### Defined in

[graph/index.ts:231](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L231)

---

### isChoiceStep

▸ **isChoiceStep**(`step`): step is WizardStepWithGraph<Choice<Partial<Ordered\>\>, Tile[]\>

#### Parameters

| Name   | Type                                                                                                                |
| :----- | :------------------------------------------------------------------------------------------------------------------ |
| `step` | `WizardStepWithGraph`<[`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\>, `StepContent`\> |

#### Returns

step is WizardStepWithGraph<Choice<Partial<Ordered\>\>, Tile[]\>

#### Defined in

[wizard/index.ts:43](https://github.com/starpit/madwizard/blob/7849c0f/src/wizard/index.ts#L43)

---

### isEmpty

▸ **isEmpty**(`A`): `boolean`

#### Parameters

| Name | Type                                                                         |
| :--- | :--------------------------------------------------------------------------- |
| `A`  | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

`boolean`

#### Defined in

[graph/index.ts:259](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L259)

---

### isLeafNode

▸ **isLeafNode**<`T`\>(`graph`): graph is LeafNode<T\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`T`\> |

#### Returns

graph is LeafNode<T\>

#### Defined in

[graph/index.ts:221](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L221)

---

### isMarkdownStep

▸ **isMarkdownStep**(`step`): step is WizardStepWithGraph<Graph<Partial<Ordered\>\>, string\>

#### Parameters

| Name   | Type                                                                                                                |
| :----- | :------------------------------------------------------------------------------------------------------------------ |
| `step` | `WizardStepWithGraph`<[`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\>, `StepContent`\> |

#### Returns

step is WizardStepWithGraph<Graph<Partial<Ordered\>\>, string\>

#### Defined in

[wizard/index.ts:47](https://github.com/starpit/madwizard/blob/7849c0f/src/wizard/index.ts#L47)

---

### isParallel

▸ **isParallel**<`T`\>(`graph`): graph is Parallel<T\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`T`\> |

#### Returns

graph is Parallel<T\>

#### Defined in

[graph/index.ts:235](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L235)

---

### isSequence

▸ **isSequence**<`T`\>(`graph`): graph is Sequence<T\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`T`\> |

#### Returns

graph is Sequence<T\>

#### Defined in

[graph/index.ts:78](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L78)

---

### isStatus

▸ **isStatus**(`status`): status is Status

#### Parameters

| Name     | Type     |
| :------- | :------- |
| `status` | `string` |

#### Returns

status is Status

#### Defined in

[graph/Status.ts:29](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/Status.ts#L29)

---

### isSubTask

▸ **isSubTask**<`T`\>(`graph`): graph is SubTask<T\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`T`\> |

#### Returns

graph is SubTask<T\>

#### Defined in

[graph/index.ts:244](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L244)

---

### isTab

▸ **isTab**(`elt`): `boolean`

#### Parameters

| Name  | Type             |
| :---- | :--------------- |
| `elt` | `ElementContent` |

#### Returns

`boolean`

#### Defined in

[parser/rehype-tabbed/index.ts:49](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L49)

---

### isTabGroup

▸ **isTabGroup**(`elt`): `boolean`

#### Parameters

| Name  | Type      |
| :---- | :-------- |
| `elt` | `Element` |

#### Returns

`boolean`

#### Defined in

[parser/rehype-tabbed/index.ts:57](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L57)

---

### isTabWithProperties

▸ **isTabWithProperties**(`elt`): elt is Element

#### Parameters

| Name  | Type             |
| :---- | :--------------- |
| `elt` | `ElementContent` |

#### Returns

elt is Element

#### Defined in

[parser/rehype-tabbed/index.ts:53](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L53)

---

### isTabs

▸ **isTabs**(`props`): props is Required<TabProps\>

#### Parameters

| Name    | Type                                             |
| :------ | :----------------------------------------------- |
| `props` | `Partial`<[`TabProps`](interfaces/TabProps.md)\> |

#### Returns

props is Required<TabProps\>

#### Defined in

[parser/rehype-tabbed/index.ts:45](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L45)

---

### isTip

▸ **isTip**(`node`): node is Element

#### Parameters

| Name   | Type            |
| :----- | :-------------- |
| `node` | `Node`<`Data`\> |

#### Returns

node is Element

#### Defined in

[parser/rehype-tip/index.ts:29](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L29)

---

### isTipWithFullTitle

▸ **isTipWithFullTitle**(`node`): node is Element

#### Parameters

| Name   | Type            |
| :----- | :-------------- |
| `node` | `Node`<`Data`\> |

#### Returns

node is Element

#### Defined in

[parser/rehype-tip/index.ts:37](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L37)

---

### isTipWithoutFullTitle

▸ **isTipWithoutFullTitle**(`node`): node is Element

#### Parameters

| Name   | Type            |
| :----- | :-------------- |
| `node` | `Node`<`Data`\> |

#### Returns

node is Element

#### Defined in

[parser/rehype-tip/index.ts:41](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L41)

---

### isTitledSteps

▸ **isTitledSteps**<`T`\>(`graph`): graph is TitledSteps<T\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name    | Type                              |
| :------ | :-------------------------------- |
| `graph` | [`Graph`](modules.md#graph)<`T`\> |

#### Returns

graph is TitledSteps<T\>

#### Defined in

[graph/index.ts:239](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L239)

---

### newChoiceState

▸ **newChoiceState**(): [`ChoiceState`](interfaces/ChoiceState.md)

#### Returns

[`ChoiceState`](interfaces/ChoiceState.md)

#### Defined in

[choices/index.ts:41](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L41)

---

### order

▸ **order**(`graph`, `ordinal?`): [`Graph`](modules.md#graph)<[`Ordered`](interfaces/Ordered.md)\>

#### Parameters

| Name      | Type                                                                         | Default value |
| :-------- | :--------------------------------------------------------------------------- | :------------ |
| `graph`   | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> | `undefined`   |
| `ordinal` | `number`                                                                     | `0`           |

#### Returns

[`Graph`](modules.md#graph)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/order.ts:108](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/order.ts#L108)

---

### orderSubTask

▸ **orderSubTask**(`graph`, `ordinal?`): [`SubTask`](modules.md#subtask)<[`Ordered`](interfaces/Ordered.md)\>

#### Parameters

| Name      | Type                                                                             | Default value |
| :-------- | :------------------------------------------------------------------------------- | :------------ |
| `graph`   | [`SubTask`](modules.md#subtask)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> | `undefined`   |
| `ordinal` | `number`                                                                         | `0`           |

#### Returns

[`SubTask`](modules.md#subtask)<[`Ordered`](interfaces/Ordered.md)\>

#### Defined in

[graph/order.ts:79](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/order.ts#L79)

---

### parallel

▸ **parallel**(`parallel`): [`Parallel`](modules.md#parallel)

#### Parameters

| Name       | Type                                                                           |
| :--------- | :----------------------------------------------------------------------------- |
| `parallel` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\>[] |

#### Returns

[`Parallel`](modules.md#parallel)

#### Defined in

[graph/index.ts:90](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L90)

---

### parse

▸ **parse**(`input`, `choices?`, `uuid?`): `Promise`<{ `ast`: `Promise`<`Root`\> ; `blocks`: `CodeBlockProps`[] ; `choices`: [`ChoiceState`](interfaces/ChoiceState.md) }\>

#### Parameters

| Name      | Type                                       |
| :-------- | :----------------------------------------- |
| `input`   | `VFile`                                    |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) |
| `uuid`    | `any`                                      |

#### Returns

`Promise`<{ `ast`: `Promise`<`Root`\> ; `blocks`: `CodeBlockProps`[] ; `choices`: [`ChoiceState`](interfaces/ChoiceState.md) }\>

#### Defined in

[parser/index.ts:83](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/index.ts#L83)

---

### progress

▸ **progress**(`graph`, `statusMap?`, `choices?`, `filterOut?`): `Progress`

#### Parameters

| Name         | Type                                                             |
| :----------- | :--------------------------------------------------------------- |
| `graph`      | [`Graph`](modules.md#graph)<[`Ordered`](interfaces/Ordered.md)\> |
| `statusMap?` | `Record`<`string`, [`Status`](modules.md#status)\>               |
| `choices?`   | [`ChoiceState`](interfaces/ChoiceState.md)                       |
| `filterOut?` | (`props`: `CodeBlockProps`) => `boolean`                         |

#### Returns

`Progress`

progress towards success of the given `graph`

#### Defined in

[graph/progress.ts:24](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/progress.ts#L24)

---

### rehypeCodeIndexer

▸ **rehypeCodeIndexer**(`uuid`, `codeblocks?`): `Transformer`<`Element`, `Element`\>

This rehype plugin adds a unique codeIdx ordinal property to each
executable code block.

#### Parameters

| Name          | Type               |
| :------------ | :----------------- |
| `uuid`        | `string`           |
| `codeblocks?` | `CodeBlockProps`[] |

#### Returns

`Transformer`<`Element`, `Element`\>

#### Defined in

[parser/rehype-code-indexer/index.ts:94](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-code-indexer/index.ts#L94)

---

### rehypeTabbed

▸ **rehypeTabbed**(`uuid`, `choices`): (`tree`: `Node`<`Data`\>) => `void` \| `Node`<`Data`\> \| `Error` \| `Promise`<`void` \| `Node`<`Data`\>\>

#### Parameters

| Name      | Type                                       |
| :-------- | :----------------------------------------- |
| `uuid`    | `string`                                   |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md) |

#### Returns

`fn`

▸ (`tree`): `void` \| `Node`<`Data`\> \| `Error` \| `Promise`<`void` \| `Node`<`Data`\>\>

##### Parameters

| Name   | Type            |
| :----- | :-------------- |
| `tree` | `Node`<`Data`\> |

##### Returns

`void` \| `Node`<`Data`\> \| `Error` \| `Promise`<`void` \| `Node`<`Data`\>\>

#### Defined in

[parser/rehype-tabbed/index.ts:73](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L73)

---

### rehypeTip

▸ **rehypeTip**(): (`tree`: `any`) => `any`

#### Returns

`fn`

▸ (`tree`): `any`

##### Parameters

| Name   | Type  |
| :----- | :---- |
| `tree` | `any` |

##### Returns

`any`

#### Defined in

[parser/rehype-tip/index.ts:45](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tip/index.ts#L45)

---

### sameChoices

▸ **sameChoices**(`A`, `B`): `boolean`

#### Parameters

| Name | Type                                       |
| :--- | :----------------------------------------- |
| `A`  | [`ChoiceState`](interfaces/ChoiceState.md) |
| `B`  | [`ChoiceState`](interfaces/ChoiceState.md) |

#### Returns

`boolean`

#### Defined in

[graph/index.ts:268](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L268)

---

### sameGraph

▸ **sameGraph**(`A`, `B`): `any`

#### Parameters

| Name | Type                                                                         |
| :--- | :--------------------------------------------------------------------------- |
| `A`  | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |
| `B`  | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |

#### Returns

`any`

#### Defined in

[graph/index.ts:272](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L272)

---

### seq

▸ **seq**(`block`): [`Sequence`](modules.md#sequence)

#### Parameters

| Name    | Type             |
| :------ | :--------------- |
| `block` | `CodeBlockProps` |

#### Returns

[`Sequence`](modules.md#sequence)

#### Defined in

[graph/index.ts:101](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L101)

---

### sequence

▸ **sequence**(`graphs`): [`Sequence`](modules.md#sequence)

#### Parameters

| Name     | Type                                                                           |
| :------- | :----------------------------------------------------------------------------- |
| `graphs` | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\>[] |

#### Returns

[`Sequence`](modules.md#sequence)

#### Defined in

[graph/index.ts:82](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L82)

---

### setTabGroup

▸ **setTabGroup**(`elt`, `group`): `void`

#### Parameters

| Name    | Type      |
| :------ | :-------- |
| `elt`   | `Element` |
| `group` | `string`  |

#### Returns

`void`

#### Defined in

[parser/rehype-tabbed/index.ts:61](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L61)

---

### setTabTitle

▸ **setTabTitle**(`elt`, `title`): `string`

#### Parameters

| Name    | Type      |
| :------ | :-------- |
| `elt`   | `Element` |
| `title` | `string`  |

#### Returns

`string`

#### Defined in

[parser/rehype-tabbed/index.ts:69](https://github.com/starpit/madwizard/blob/7849c0f/src/parser/rehype-tabbed/index.ts#L69)

---

### subtask

▸ **subtask**<`T`\>(`key`, `title`, `description`, `filepath`, `graph`, `source?`): [`SubTask`](modules.md#subtask)<[`Unordered`](modules.md#unordered)\>

#### Type parameters

| Name | Type                                                                                                                                          |
| :--- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `T`  | extends [`Ordered`](interfaces/Ordered.md) \| `Partial`<[`Ordered`](interfaces/Ordered.md)\> = `Partial`<[`Ordered`](interfaces/Ordered.md)\> |

#### Parameters

| Name          | Type                                    | Default value |
| :------------ | :-------------------------------------- | :------------ |
| `key`         | `string`                                | `undefined`   |
| `title`       | `string`                                | `undefined`   |
| `description` | `string`                                | `undefined`   |
| `filepath`    | `string`                                | `undefined`   |
| `graph`       | [`Sequence`](modules.md#sequence)<`T`\> | `undefined`   |
| `source`      | `string`                                | `""`          |

#### Returns

[`SubTask`](modules.md#subtask)<[`Unordered`](modules.md#unordered)\>

#### Defined in

[graph/index.ts:184](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/index.ts#L184)

---

### validate

▸ **validate**(`graph`, `executor?`): `Promise`<[`Status`](modules.md#status)\>

#### Parameters

| Name       | Type                                                                         | Default value |
| :--------- | :--------------------------------------------------------------------------- | :------------ |
| `graph`    | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> | `undefined`   |
| `executor` | (`cmdline`: `string`) => `Promise`<`"success"`\>                             | `shellExec`   |

#### Returns

`Promise`<[`Status`](modules.md#status)\>

#### Defined in

[graph/validate.ts:99](https://github.com/starpit/madwizard/blob/7849c0f/src/graph/validate.ts#L99)

---

### wizardify

▸ **wizardify**(`dag`, `choices`): [`Wizard`](modules.md#wizard)

#### Parameters

| Name      | Type                                                                         |
| :-------- | :--------------------------------------------------------------------------- |
| `dag`     | [`Graph`](modules.md#graph)<`Partial`<[`Ordered`](interfaces/Ordered.md)\>\> |
| `choices` | [`ChoiceState`](interfaces/ChoiceState.md)                                   |

#### Returns

[`Wizard`](modules.md#wizard)

#### Defined in

[wizard/index.ts:91](https://github.com/starpit/madwizard/blob/7849c0f/src/wizard/index.ts#L91)
