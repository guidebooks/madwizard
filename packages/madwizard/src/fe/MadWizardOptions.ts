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

import { RawImpl } from "./raw/index.js"
import { CompilerOptions } from "../graph/compile.js"

export interface RunOptions {
  /**
   * Interactive mode: even if a choice has a prior selection that is
   * still valid, ask the user again to make that choice.
   */
  interactive: boolean

  /** Interactive mode for a given guidebook */
  ifor: string

  /** Don't actually execute anything, but making choices and
   * validation and expanding lists is ok
   */
  dryRun: boolean

  /** Name of profile to use */
  profile: string

  /**
   * Profile flush hysteresis. To avoid a flood of file writes, you
   * can control the hystersis delay for profile persistence [default:
   * 50ms]
   */
  profileSaveDelay: number

  /**
   * Clean up guidebook subprocesses, instead of relying on the caller
   * to do so, via the return value from `fe/cli` [default: true]
   */
  clean: boolean

  /** Callback prior to running the guidebook */
  onBeforeRun(opts: { cleanExit(): void }): void

  /** Assert answers to certain questions */
  assertions: Record<string, string>

  /**
   * In case clients want to handle certain command line executions
   * directly (rather than by shelling them out to a PTY).
   */
  shell: {
    /** Do you know how to handle the given `cmdline`? */
    willHandle(cmdline: string | boolean): boolean

    /** Execute the given `cmdline` with the given `env` */
    exec(cmdline: string | boolean, env: import("../memoization/index.js").Memos["env"]): Promise<string>
  }

  /** Optional conduit for process.stdin and process.stdout data */
  stdio: {
    /** Conduit for process.stdin data */
    stdin: NodeJS.ReadableStream

    /** Conduit for process.stdout data */
    stdout: NodeJS.WritableStream
  }
}

export interface DisplayOptions<R extends RawImpl = RawImpl> {
  /** name to display in log messages */
  name: string

  /** Shorten output of long or multi-line code blocks. */
  narrow: boolean

  /** Verbose output */
  verbose: boolean

  /** Clear the screen when running in guide mode [default: true] */
  clear: boolean

  /** Bump the lastUsedTime attribute of the profile? [default: true] */
  bump: boolean

  /**
   * In raw mode, any questions will be emitted as a raw json model
   * either to stdout (if `raw` is a string; with control limits
   * prefixed by this given string ) or to a callback (if `raw` is a
   * function).
   */
  raw: R
}

export interface FetchOptions {
  /** Base URI of Guidebook store? */
  store: string

  /**
   * Path to an mkdocs.yml config. This may be used to assist in
   * finding snippet content when parsing markdown.
   */
  mkdocs: string

  /** Location of persisted profiles (remembered choices from prior runs) */
  profilesPath: string

  /** Location for guidebooks to store persisted data */
  dataPath: string
}

/** Allow clients to provide alternative impls of certain shell operations */
type FileSystemOptions = {
  fs: Partial<{
    mkdirp(filepath: string): Promise<void>
    readFile(filepath: string, cb: (err: NodeJS.ErrnoException | null, data: Buffer) => void): void
    writeFile(filepath: string, cb: (err: NodeJS.ErrnoException | null) => void): void
    writeFileAtomic: typeof import("write-file-atomic")
  }>
}

export type MadWizardOptions<R extends RawImpl = RawImpl> = Partial<CompilerOptions> &
  Partial<DisplayOptions<R>> &
  Partial<FetchOptions> &
  Partial<RunOptions> &
  Partial<FileSystemOptions>

/** The front-end modules allow passing through input programmatically */
export type MadWizardOptionsWithInput = MadWizardOptions & { vfile?: import("vfile").VFile }
