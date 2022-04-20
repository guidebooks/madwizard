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

import { basename } from "path"

import {
  OrderedGraph,
  OrderedSubTask,
  OrderedTitledSteps,
  OrderedChoice,
  OrderedSequence,
  OrderedParallel,
  OrderedLeafNode,
  LeafNode,
  StatusMap,
  isEmpty,
  isSubTask,
  isTitledSteps,
  isChoice,
  isSequence,
  isParallel,
  progress,
} from "../../graph"

import { UI } from "./ui"
import { UITree } from "./props"
import TreeTransformer from "./xform"

export * from "./ui"
export * from "./props"
export * from "./pretty-print"

type Progress = { nDone: number; nError: number; nTotal: number }

export class Treeifier<Content> {
  public constructor(
    private readonly ui: UI<Content>,
    private readonly status: StatusMap = {},
    private readonly validator?: (graph: LeafNode) => void | Promise<void>
  ) {}

  private isDone({ nDone, nTotal }: Progress) {
    return nDone === nTotal
  }

  private withIcons(
    rollupStatus: Progress,
    origin: OrderedGraph,
    data: UITree<Content>[number],
    showBadge = this.isDone(rollupStatus)
  ) {
    const isTotallyDone = this.isDone(rollupStatus)
    const hasErrors = rollupStatus.nError > 0
    // const doneOrErrors = isTotallyDone || hasErrors

    const showIcon = data.icon || !showBadge

    const badgeProps = !showBadge
      ? { hasBadge: false }
      : {
          hasBadge: true,
          badgeProps: { isRead: !isTotallyDone },
          customBadgeContent: isTotallyDone
            ? this.ui.statusToIcon("success")
            : /*<span className="nowrap">{*/ `${rollupStatus.nDone} of ${rollupStatus.nTotal}` /*}</span>*/,
        }

    return Object.assign({ id: origin.order.toString() }, data, badgeProps, {
      "data-origin": origin,
      "data-has-errors": hasErrors,
      "data-is-totally-done": isTotallyDone,
      expandedIcon: data.expandedIcon || null,
      icon:
        showIcon && data.icon /*|| (doneOrErrors && <LabelWithStatus status={hasErrors ? 'error' : 'success'} />))*/,
    })
  }

  private treeModelForSubTask(origin: OrderedSubTask, depth: number, metFirstChoice = false): UITree<Content> {
    const { key, title, filepath, graph } = origin
    const rollupStatus = progress(graph, this.status)
    const children = new TreeTransformer<Content>().foldChoices(
      graph.sequence
        .map((_) => this.toTree(_, key, depth + 1, metFirstChoice))
        .filter(Boolean)
        .flatMap((_) => _)
    )

    if (children.length === 0) {
      return
    }

    const hasAction = !!filepath
    const hasBadge = hasAction && rollupStatus.nDone > 0
    const hasIcon = hasAction

    const data = this.withIcons(
      rollupStatus,
      origin,
      {
        id: origin.order.toString(),
        name: this.ui.title(title || basename(filepath)),
        defaultExpanded: !this.isDone(rollupStatus) && depth < 2,
        children: children.length === 0 ? undefined : children,
        icon: hasIcon && this.ui.icon("Guidebook"),
        expandedIcon: hasIcon && this.ui.icon("GuidebookOpen"),
        action: hasAction && this.ui.open && this.ui.open(filepath),
      },
      hasBadge
    )

    return [new TreeTransformer<Content>().foldNestedSubTask(data)]
  }

  private treeModelForTitledStep(
    graph: OrderedTitledSteps["steps"][number],
    idPrefix = "",
    depth = 0,
    metFirstChoice = false
  ) {
    return this.treeModelForSequence(graph.graph, idPrefix, depth, metFirstChoice, this.ui.title(graph.title))
  }

  private treeModelForTitledSteps(graph: OrderedTitledSteps, idPrefix = "", depth = 0, metFirstChoice = false) {
    const _children = graph.steps
      .map((_, childIdx) => this.treeModelForTitledStep(_, `${idPrefix}-s${childIdx}`, depth + 1, metFirstChoice))
      .filter(Boolean)
    const rollupStatus = progress(graph, this.status)
    const children = _children.flatMap((_) => _)

    return [
      this.withIcons(rollupStatus, graph, {
        name: this.ui.title(graph.title),
        defaultExpanded: !metFirstChoice || depth < 2,
        children,
      }),
    ]
  }

  private treeModelForSequence(
    graph: OrderedSequence,
    idPrefix = "",
    depth = 0,
    metFirstChoice = false,
    name?: Content
  ) {
    const _children = graph.sequence
      .map((_, childIdx) => this.toTree(_, `${idPrefix}-s${childIdx}`, depth + 1, metFirstChoice, name))
      .filter(Boolean)
    const rollupStatus = progress(graph, this.status)
    const children = new TreeTransformer<Content>().optimize(
      _children.flatMap((_) => _),
      depth
    )

    // only show the "n of m" text for the root
    const hasBadge = this.isDone(rollupStatus) || depth === 0

    const data = [
      this.withIcons(
        rollupStatus,
        graph,
        {
          name: this.ui.title(name || "Sequence"),
          defaultExpanded: !metFirstChoice || depth < 1,
          children: children.length === 0 ? undefined : children,
        },
        hasBadge
      ),
    ]

    return new TreeTransformer<Content>().foldSingletonSubTask(data)
  }

  private treeModelForParallel(
    graph: OrderedParallel,
    idPrefix = "",
    depth = 0,
    metFirstChoice = false,
    name?: Content
  ): UITree<Content> {
    const _children = graph.parallel
      .map((_, childIdx) => this.toTree(_, `${idPrefix}-p${childIdx}`, depth + 1, metFirstChoice, name))
      .filter(Boolean)
    const rollupStatus = progress(graph, this.status)
    const children = _children.flatMap((_) => _)

    const data =
      children.length === 1
        ? children // [Object.assign(children[0], { name: name || children[0].name })]
        : [
            this.withIcons(rollupStatus, graph, {
              name: this.ui.title(name || "Parallel"),
              defaultExpanded: depth < 1,
              children: children.length === 0 ? undefined : children,
            }),
          ]
    return data
  }

  private treeModelForChoice(graph: OrderedChoice, idPrefix = "", depth = 0): UITree<Content> {
    const _children = graph.choices
      .filter((_) => !isEmpty(_.graph))
      .map((_) =>
        this.toTree(
          _.graph,
          `${idPrefix}-g${graph.group}-m${_.member}`,
          depth + 1,
          true,
          this.ui.title([this.ui.span(`Option ${_.member + 1}:`, "bold", "blue"), _.title])
        )
      )
      .filter(Boolean)
    const rollupStatus = progress(graph, this.status)
    const children = _children.flatMap((_) => _)

    const data = [
      this.withIcons(rollupStatus, graph, {
        name: graph.title ? this.ui.title(graph.title) : this.ui.title("Missing heading for choice", "error"),
        defaultExpanded: true,
        children,
      }),
    ]
    return data
  }

  private treeModelForLeafNode(graph: OrderedLeafNode): UITree<Content> {
    if (this.validator) {
      setTimeout(() => this.validator(graph))
    }

    try {
      const id = graph.order.toString()
      // const myStatus = status[graph.id]

      const data = [
        {
          id,
          // icon: myStatus && myStatus !== 'success' && <LabelWithStatus status={myStatus} />,
          name: this.ui.code(
            graph.body
              .split(/\n/)
              .map((_) => _.replace(/#.*/, ""))
              .filter(Boolean)[0]
              .trim()
              .slice(0, 30)
          ),
        },
      ]

      return data
    } catch (err) {
      console.error("Error rendering code block", graph, err)
    }
  }

  public toTree(
    graph: OrderedGraph,
    idPrefix = "",
    depth = 0,
    metFirstChoice = false,
    name?: Content
  ): UITree<Content> {
    if (isSequence(graph)) {
      return this.treeModelForSequence(graph, idPrefix, depth, metFirstChoice, name)
    } else if (isTitledSteps(graph)) {
      return this.treeModelForTitledSteps(graph, idPrefix, depth, metFirstChoice)
    } else if (isParallel(graph)) {
      return this.treeModelForParallel(graph, idPrefix, depth, metFirstChoice, name)
    } else if (isChoice(graph)) {
      return this.treeModelForChoice(graph, idPrefix, depth)
    } else if (isSubTask(graph)) {
      return this.treeModelForSubTask(graph, depth, metFirstChoice)
    } else if (!graph.optional) {
      return this.treeModelForLeafNode(graph)
    }
  }
}
