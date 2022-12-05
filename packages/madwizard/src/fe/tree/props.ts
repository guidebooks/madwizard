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

export interface UINode<Content> {
  /** Internal content of a tree view item */
  name: Content
  /** Title a tree view item. Only used in Compact presentations. */
  title?: Content
  /** ID of a tree view item */
  id?: string
  /** Child nodes of a tree view item */
  children?: UITree<Content>
  /** Flag indicating if node is expanded by default */
  defaultExpanded?: boolean
  /** Default icon of a tree view item */
  icon?: Content
  /** Expanded icon of a tree view item */
  expandedIcon?: Content
  /** Flag indicating if a tree view item has a checkbox */
  hasCheck?: boolean
  /** Additional properties of the tree view item checkbox */
  // checkProps?: TreeViewCheckProps;
  /** Flag indicating if a tree view item has a badge */
  hasBadge?: boolean
  /** Optional prop for custom badge */
  customBadgeContent?: Content
  /** Additional properties of the tree view item badge */
  badgeProps?: any
  /** Action of a tree view item, can be a Button or Dropdown */
  action?: Content
}

export type UITree<Content> = UINode<Content>[]
