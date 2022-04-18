[madwizard](../README.md) / [Exports](../modules.md) / ChoiceState

# Interface: ChoiceState

## Table of contents

### Properties

- [offChoice](ChoiceState.md#offchoice)
- [onChoice](ChoiceState.md#onchoice)

### Methods

- [clone](ChoiceState.md#clone)
- [contains](ChoiceState.md#contains)
- [entries](ChoiceState.md#entries)
- [get](ChoiceState.md#get)
- [keys](ChoiceState.md#keys)
- [remove](ChoiceState.md#remove)
- [set](ChoiceState.md#set)

## Properties

### offChoice

• **offChoice**: `ChoiceHandlerRegistration`

#### Defined in

[choices/index.ts:27](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L27)

---

### onChoice

• **onChoice**: `ChoiceHandlerRegistration`

#### Defined in

[choices/index.ts:26](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L26)

## Methods

### clone

▸ **clone**(): [`ChoiceState`](ChoiceState.md)

#### Returns

[`ChoiceState`](ChoiceState.md)

#### Defined in

[choices/index.ts:25](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L25)

---

### contains

▸ **contains**<`K`\>(`key`): `boolean`

#### Type parameters

| Name | Type             |
| :--- | :--------------- |
| `K`  | extends `string` |

#### Parameters

| Name  | Type |
| :---- | :--- |
| `key` | `K`  |

#### Returns

`boolean`

#### Defined in

[choices/index.ts:31](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L31)

---

### entries

▸ **entries**(): [`string`, `any`][]

#### Returns

[`string`, `any`][]

#### Defined in

[choices/index.ts:30](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L30)

---

### get

▸ **get**<`K`\>(`key`): `string`

#### Type parameters

| Name | Type             |
| :--- | :--------------- |
| `K`  | extends `string` |

#### Parameters

| Name  | Type |
| :---- | :--- |
| `key` | `K`  |

#### Returns

`string`

#### Defined in

[choices/index.ts:32](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L32)

---

### keys

▸ **keys**(): `string`[]

#### Returns

`string`[]

#### Defined in

[choices/index.ts:29](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L29)

---

### remove

▸ **remove**<`K`\>(`key`): `boolean`

#### Type parameters

| Name | Type             |
| :--- | :--------------- |
| `K`  | extends `string` |

#### Parameters

| Name  | Type |
| :---- | :--- |
| `key` | `K`  |

#### Returns

`boolean`

#### Defined in

[choices/index.ts:34](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L34)

---

### set

▸ **set**<`K`\>(`key`, `value`, `overrideRejections?`): `boolean`

#### Type parameters

| Name | Type             |
| :--- | :--------------- |
| `K`  | extends `string` |

#### Parameters

| Name                  | Type      |
| :-------------------- | :-------- |
| `key`                 | `K`       |
| `value`               | `string`  |
| `overrideRejections?` | `boolean` |

#### Returns

`boolean`

#### Defined in

[choices/index.ts:33](https://github.com/starpit/madwizard/blob/7849c0f/src/choices/index.ts#L33)
