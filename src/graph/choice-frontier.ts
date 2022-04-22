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

import { v4 } from "uuid"

import {
  Choice,
  Graph,
  hasKey,
  hasTitle,
  isLeafNode,
  isSubTask,
  isChoice,
  isSequence,
  isParallel,
  isTitledSteps,
  asSubTask,
  subtask,
} from "."

function key(graph: Graph) {
  if (hasKey(graph)) {
    return graph.key
  } else if (hasTitle(graph)) {
    return graph.title
  } else if (isChoice(graph)) {
    return graph.group
  } else {
    return graph.id
  }
}

/**
 * Find the first set of `CodeBlock` nodes, when scanning the given
 * `graph`. Do not scan under Choice nodes for nested subtasks, as we
 * assume that `collapseMadeChoices` has already been applied to the
 * given `graph`.
 */

export function findCodeBlockFrontier(graph: Graph): Graph[] {
  if (isSubTask(graph)) {
    const children = findCodeBlockFrontier(graph.graph)
    if (children.every(isLeafNode)) {
      return [graph]
    } else {
      return children
    }
  } else if (isChoice(graph)) {
    return []
  } else if (isSequence(graph)) {
    return graph.sequence.flatMap(findCodeBlockFrontier)
  } else if (isParallel(graph)) {
    return graph.parallel.flatMap(findCodeBlockFrontier)
  } else if (isTitledSteps(graph)) {
    return graph.steps.flatMap((_) => findCodeBlockFrontier(_.graph))
  } else {
    return [graph]
  }
}

/**
 * Enumerate the Prerequisites and Main Tasks in the given `graph.
 */
export function findPrereqsAndMainTasks(graph: Graph): Graph[] {
  if (isSubTask(graph) && isSequence(graph.graph) && graph.graph.sequence.length === 2) {
    const child1 = graph.graph.sequence[0]
    const child2 = graph.graph.sequence[1]

    if (hasTitle(child1) && child1.title === "Prerequisites" && hasTitle(child2) && child2.title === "Main Tasks") {
      // this needs a bit more refinement. we need to find a general
      // way to deal with an arbitrary mixture of titled and untitled
      // tasks
      const children1 = isSubTask(child1) ? child1.graph.sequence : child1.steps.map((_) => _.graph)
      const children2 = isSubTask(child2) ? child2.graph.sequence : child2.steps.map((_) => _.graph)
      if (children1.every((_) => hasTitle(_)) && children2.every((_) => hasTitle(_))) {
        return children1.concat(children2)
      } else if (isTitledSteps(child2)) {
        return children1.concat(child2.steps.map(asSubTask))
      }
    }
  } else if (isTitledSteps(graph)) {
    return graph.steps.map((_) => subtask(v4(), _.title, _.description, "", _.graph, _.source))
  }

  return []
}

/**
 * Find the first set of `Choice` nodes, when scanning the given
 * `graph`. Do not scan under Choice nodes for nested choices... we
 * assume that `collapseMadeChoices` has already been applied to the
 * `graph`.
 *
 */
export function findChoiceFrontier(
  graph: Graph,
  prereqs: Graph[] = [],
  marks: Record<string, boolean> = {}
): { prereqs?: Graph[]; choice: Choice }[] {
  if (isChoice(graph)) {
    marks[key(graph)] = true

    // user has not yet made a choice. stop here and consume all
    // prereqs
    const frontier = [{ prereqs: prereqs.slice(), choice: graph }]
    prereqs.forEach((_) => (marks[key(_)] = true))
    prereqs.splice(0, prereqs.length) // consume...
    return frontier
  } else if (isSubTask(graph)) {
    const frontier = findChoiceFrontier(graph.graph, prereqs, marks)

    if (graph.title === "Prerequisites") {
      graph.graph.sequence.forEach((_) => {
        if (!marks[key(_)]) {
          prereqs.push(_)
          marks[key(_)] = true
        }
      })
      marks[key(graph)] = true
    }

    if (isSequence(graph.graph) && graph.graph.sequence.every((child) => marks[key(child)])) {
      marks[key(graph)] = true

      if (frontier.length === 0 && graph.title === "Prerequisites") {
        graph.graph.sequence.forEach((_) => {
          if (!marks[key(_)]) {
            prereqs.push(_)
            marks[key(_)] = true
          }
        })
      }
    }
    return frontier
  } else if (isSequence(graph)) {
    const frontier = graph.sequence.flatMap((_) => {
      const frontier = findChoiceFrontier(_, prereqs, marks)

      if (!marks[key(_)]) {
        prereqs.push(_)
      }

      return frontier
    })
    graph.sequence.forEach((a) => {
      const idx = prereqs.findIndex((b) => a === b)
      if (idx >= 0) {
        prereqs.splice(idx, 1)
      }
    })
    if (graph.sequence.every((child) => marks[key(child)])) {
      marks[key(graph)] = true
    }
    return frontier
  } else if (isParallel(graph)) {
    const frontier = graph.parallel.flatMap((_) => {
      const frontier = findChoiceFrontier(_, prereqs, marks)

      if (!marks[key(_)]) {
        prereqs.push(_)
      }

      return frontier
    })
    graph.parallel.forEach((a) => {
      const idx = prereqs.findIndex((b) => a === b)
      if (idx >= 0) {
        prereqs.splice(idx, 1)
      }
    })
    if (graph.parallel.every((child) => marks[key(child)])) {
      marks[key(graph)] = true
    }
    return frontier
  } else if (isTitledSteps(graph)) {
    const frontier = graph.steps.flatMap((_) => {
      const frontier = findChoiceFrontier(_.graph, prereqs, marks)

      if (!marks[key(_.graph)]) {
        if (hasTitle(_.graph)) {
          prereqs.push(_.graph)
        } else {
          prereqs.push(subtask(_.title, _.title, _.description, "", _.graph, _.source))
        }
      }

      return frontier
    })
    graph.steps.forEach(({ graph: a }) => {
      const idx = prereqs.findIndex((b) => a === b)
      if (idx >= 0) {
        prereqs.splice(idx, 1)
      }
    })
    if (graph.steps.every((step) => marks[key(step.graph)])) {
      marks[key(graph)] = true
    }
    return frontier
  } else {
    // leaf-most code blocks. no choices here.
    return []
  }
}

export function isValidFrontier(frontier: ReturnType<typeof findChoiceFrontier>): boolean {
  return frontier.length > 0 && frontier.every((_) => _.prereqs.length > 0 || !!_.choice)
}

export function findChoiceFrontierWithFallbacks(graph: Graph) {
  const frontier1 = findChoiceFrontier(graph)

  const frontier2 = isValidFrontier(frontier1)
    ? frontier1
    : [
        {
          prereqs: findPrereqsAndMainTasks(graph),
          choice: undefined,
        },
      ]

  const frontier = isValidFrontier(frontier2)
    ? frontier2
    : [
        {
          prereqs: findCodeBlockFrontier(graph),
          choice: undefined,
        },
      ]

  return frontier
}

export function findChoicesOnFrontier(graph: Graph): Choice[] {
  return findChoiceFrontier(graph).map((_) => _.choice)
}
