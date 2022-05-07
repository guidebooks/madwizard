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

import { relative } from "path"
import { Graph, SubTask } from "."

/**
 * Usually this will be a representation of the underlying guidebook
 * that contained a particular node in a `Graph`.`
 */
export interface Provenance {
  /** A set of canonical representations of the origin stories of a `Graph` */
  provenance: string[]
}

/** Does the given `graph` have a `Provenance`? */
export function hasProvenance(graph: Graph): graph is Graph & Provenance {
  const { provenance } = graph as Provenance
  return Array.isArray(provenance) && provenance.length > 0 && provenance.every((_) => typeof _ === "string")
}

/** Determine the `Provenance` of the given `SubTask` */
export default function provenanceOf(task: SubTask) {
  if (task.filepath) {
    const match = task.filepath.match(
      /^https:\/\/raw.githubusercontent.com\/guidebooks\/store\/main\/guidebooks\/(.+)\..+$/
    )
    if (match) {
      return match[1]
    } else {
      return relative(process.cwd(), task.filepath)
    }
  }
}
