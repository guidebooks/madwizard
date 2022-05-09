/*
 * Copyright 2022 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { StatusMap } from "../graph"
import { ExpansionMap } from "../choices/groups/expansion"

/** Optimize certain expensive or non-idempotent operations */
export interface Memos {
  /** the `Status` of a given `LeafNode` in a `Graph` */
  statusMemo: StatusMap

  /** the expanded choices for a given `Choice`, keyed by it's `key` property */
  expansionMemo: ExpansionMap
}

/** Default implementation of `Memos` */
export class Memoizer implements Memos {
  /** the `Status` of a given `LeafNode` in a `Graph` */
  public readonly statusMemo: StatusMap = {}

  /** the expanded choices for a given `ChoicePart`, keyed by it's `expansionExpr` property */
  public readonly expansionMemo: ExpansionMap = {}
}
