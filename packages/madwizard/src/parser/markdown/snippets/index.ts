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

import chalk from "chalk"
import Debug from "debug"
import { load } from "js-yaml"
import { mainSymbols } from "figures"
import expandHomeDir from "expand-home-dir"
import { isAbsolute as pathIsAbsolute, dirname as pathDirname, join as pathJoin, relative } from "path"

import { isUrl, toRawGithubUserContent } from "./urls.js"
import { oraPromise } from "../../../util/ora-delayed-promise.js"

import codegenFinally from "../../../exec/finally/codegen.js"

import indent from "../util/indent.js"
import { MadWizardOptions } from "../../../fe/index.js"
import { tryFrontmatter } from "../frontmatter/frontmatter-parser.js"
import {
  Import,
  getImportEnv,
  getImportGroup,
  getImportPath,
  hasImports,
  hasFinally,
} from "../frontmatter/KuiFrontmatter.js"

// FIXME refactor this
import { canonicalProvenanceOf } from "../../../graph/provenance.js"

const RE_DOCS_URL = /^(https:\/\/([^/]+\/){4}docs)/

const RE_INCLUDE = /^(\s*){%\s+include "([^"]+)"\s+%}/
//                 [1]                    [2]
//                  \- [1] leading whitespace
//                                         \- filepath to import

const RE_IMPORT = /^(\s*):import{(.*)}\s*$/
//                   [1]          [2]
//                    \- [1] leading whitespace
//                                \- filepath to import

const RE_SNIPPET = /^(\s*)--(-*)8<--(-*)\s+"([^"]+)"\s*$/
//                    [1]   [2]     [3]      [4]
//                    \- [1] leading whitespace
//                                           \- [4] snippet file name

function isError(x: string | Error) {
  return x && x.constructor === Error
}

function dirname(a: string) {
  if (isUrl(a)) {
    const url = new URL(a)
    url.pathname = pathDirname(url.pathname)
    return url.toString()
  } else {
    return pathDirname(a)
  }
}

export function join(a: string, b: string) {
  if (isUrl(a)) {
    const url = new URL(a)
    url.pathname = pathJoin(url.pathname, b)
    return url.toString()
  } else {
    return pathJoin(a, b)
  }
}

export function isAbsolute(uri: string): boolean {
  return isUrl(uri) || pathIsAbsolute(uri)
}

function toString(data: string | object) {
  return (typeof data === "string" ? data : JSON.stringify(data)).replace(/\n$/, "")
}

/** e.g. ml/codeflare some "absolute" reference to the store */
function isAbsoluteStoreRef(filepath: string, opts: Options) {
  return (
    !isUrl(filepath) &&
    !!opts.madwizardOptions &&
    !!opts.madwizardOptions.store &&
    !isAbsolute(filepath) &&
    !/^\./.test(filepath)
  )
}

/** Rewrite any relative <img> and <a> links to use the given basePath */
function rerouteLinks(basePath: string, data: string) {
  return data.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g, // e.g. [linky](https://linky.com)
    (_, p1, p2) => {
      return `[${p1}](${isAbsolute(p2) ? p2 : join(basePath, p2)})`
    }
  )
}

type Pair = { myBasePath: string; filepath: string }
type LookupTable = Record<Pair["filepath"], Pair>

function toLookupTable(list: Pair[]): LookupTable {
  return list.reduce((M, pair) => {
    M[pair.filepath] = pair
    return M
  }, {})
}

function removeDuplicates(list: Pair[]) {
  const uniqueKeys = [...new Set(list.map((_) => _.filepath))]
  const lookupTable = toLookupTable(list)
  return uniqueKeys.map((filepath) => lookupTable[filepath])
}

/**
 * We want to use remark-directive's `:::` syntax for container
 * directives. It does support nested containers, but the outer
 * containers have to have *more* colons than the inner
 * ones. Ugh. Since we can't predict the maximum nesting depth in
 * advance, this means we need to pick an aribtrary start point, and
 * thus have an unfortunate maximum supported nesting depth.
 *
 * reference:
 * https://github.com/micromark/micromark-extension-directive#syntax
 */
function colonColonColon(nestingDepth: number) {
  const MAX = 100
  return new Array(Math.max(3, MAX - nestingDepth)).join(":")
}

type Options = {
  snippetBasePath?: string
  includeFrontmatter?: boolean
  failFast?: boolean

  /** Fetch the contents of the given `filepath` */
  fetcher: (filepath: string) => Promise<string | Error>

  /** Options passed through from client, e.g. fe/cli */
  madwizardOptions?: MadWizardOptions
}

/** Data used by `inlineSnippets`, but not accessible to outside clients. */
type InternalOptions = {
  /** Are we processing an import? */
  inImport?: boolean

  /** How deep are we, in the import/inline chain? */
  nestingDepth?: number

  /**
   * To avoid fetching the same content more than once. Key is filepath, value is content.
   */
  snippetMemo?: Record<string, string | Error>

  /** Current memoization key prefix */
  memoKey: string

  /**
   * This provides us a way to specify a known set of base path for
   * all snippets, rather than us having to guess. See `candidates`
   * below for our heuristics in the case we have to guess.
   */
  altBasePaths?: Promise<string[]>
}

/** Small wrapper that rewrites regular github urls to raw "githubusercontent" urls */
function doFetch(filepath: string, fetcher: (filepath: string) => Promise<string | Error>) {
  return fetcher(toRawGithubUserContent(filepath))
}

/**
 * Simplistic approximation of
 * https://facelessuser.github.io/pymdown-extensions/extensions/snippets/.
 */
function inlineSnippets(opts: Options & InternalOptions) {
  const {
    fetcher,
    snippetBasePath,
    memoKey,
    includeFrontmatter = true,
    nestingDepth = 0,
    inImport = false,
    failFast = true,
    snippetMemo = {},
    altBasePaths = Promise.resolve([]),
  } = opts

  const debug = Debug("madwizard/fetch/snippets")

  const _fetchRecursively = async (
    _snippetFileName: string,
    srcFilePath: string,
    memoKey: string,
    provenance: string[],
    nestingDepth = 0,
    inImport = false
  ) => {
    debug(`${chalk.yellow(mainSymbols.triangleRight)} ${_snippetFileName}`)

    const fetchAndMemoize = async (filepath: string, memoKey: string): Promise<string | Error> => {
      try {
        const content = await doFetch(filepath, fetcher)
        debug(`${chalk.green(mainSymbols.tick)} ${snippetFileName} from ${filepath}`)
        if (typeof content === "string") {
          snippetMemo[memoKey] = content
        }
        return content
      } catch (err) {
        snippetMemo[memoKey] = err
        throw err
      }
    }
    const fetch = async (afilepath: string, memoKeyPrefix: string): Promise<string | Error> => {
      const filepath = toRawGithubUserContent(afilepath)
      const memoKey = (memoKeyPrefix + "." + afilepath).replace(/\.+/, "")
      if (isError(snippetMemo[memoKey])) {
        throw snippetMemo[memoKey]
      } else {
        return snippetMemo[memoKey] || (await fetchAndMemoize(filepath, memoKey))
      }
    }

    // is this an "absolute" reference to a base store path?
    const isStoreRef = isAbsoluteStoreRef(_snippetFileName, opts)

    // the resolved filepath of the snippet
    const snippetFileName = isStoreRef ? _snippetFileName : expandHomeDir(_snippetFileName)

    const getBasePath = (snippetBasePath: string) => {
      if (!snippetBasePath) return ""

      try {
        const basePath = snippetBasePath

        return isAbsolute(basePath) ? basePath : srcFilePath ? join(dirname(srcFilePath), basePath) : undefined
      } catch (err) {
        debug(err)
        return undefined
      }
    }

    // Call ourselves recursively, in case a fetched snippet
    // fetches other files. We also may need to reroute relative
    // <img> and <a> links according to the given `basePath`.
    const recurse = async (basePath: string, recursedSnippetFileName: string, data: string) => {
      // Note: intentionally using `snippetBasePath` for the
      // first argument, as this represents the "root" base
      // path, either from the URL of the original filepath (we
      // may be recursing here) or from the command line or from
      // the topmatter of the original document. The second
      // represents the current base path in the recursion.
      const base = isAbsolute(basePath) || !snippetBasePath ? basePath : snippetBasePath
      return inlineSnippets({
        failFast,
        fetcher,
        snippetBasePath: base,
        memoKey,
        includeFrontmatter: inImport,
        nestingDepth: nestingDepth + 1,
        inImport,
        snippetMemo,
        altBasePaths,
        madwizardOptions: opts.madwizardOptions,
      })(rerouteLinks(base, data), recursedSnippetFileName, provenance)
    }

    const candidates =
      (await altBasePaths).length > 0
        ? await altBasePaths
        : isAbsoluteStoreRef(srcFilePath, opts)
        ? [srcFilePath, dirname(srcFilePath)].map((_) => join(opts.madwizardOptions.store, _))
        : [
            snippetBasePath,
            snippetBasePath && relative(snippetBasePath, srcFilePath), // chained relative imports/includes
            srcFilePath,
            snippetBasePath && RE_DOCS_URL.test(snippetBasePath)
              ? dirname(snippetBasePath.match(RE_DOCS_URL)[1])
              : undefined,
            "./",
            "./snippets",
            "../snippets",
            "../../snippets",
            "../../../snippets",
            "../../../../snippets",
            "../../",
            "../../../",
          ].filter(Boolean)

    const snippetDatas =
      isStoreRef || isUrl(snippetFileName) || isAbsolute(snippetFileName)
        ? [
            await fetch(snippetFileName, memoKey)
              .then(async (data) => ({
                filepath: snippetFileName,
                snippetData: await recurse(
                  isStoreRef
                    ? join(opts.madwizardOptions.store, snippetFileName)
                    : snippetBasePath || dirname(snippetFileName),
                  snippetFileName,
                  toString(data)
                ),
              }))
              .catch((err) => {
                // debug("Warning: could not fetch inlined content 1", snippetBasePath, snippetFileName, err)
                return err
              }),
          ]
        : await Promise.all(
            removeDuplicates(
              candidates
                .map(getBasePath)
                .filter(Boolean)
                .map((myBasePath) => ({
                  myBasePath,
                  filepath: join(myBasePath, snippetFileName),
                }))
                .filter((_) => _ && _.filepath !== srcFilePath)
            ) // avoid cycles
              .map(({ myBasePath, filepath }) =>
                fetch(filepath, memoKey)
                  .then(async (data) => ({
                    filepath,
                    snippetData: await recurse(myBasePath, filepath, toString(data)),
                  }))
                  .catch((err) => {
                    // debug("Warning: could not fetch inlined content 2", myBasePath, snippetFileName, err)
                    return err
                  })
              )
          ).then((_) => _.filter(Boolean))

    const snippetData =
      snippetDatas.find((_) => _.snippetData !== undefined && !isError(_.snippetData)) ||
      snippetDatas.find((_) => isError(_.snippetData) && !/ENOTDIR/.test(_.snippetData.message)) ||
      snippetDatas[0]

    if (isError(snippetData)) {
      const msg = `failed to fetch snippet content (try running with DEBUG=madwizard/fetch/snippets): ${_snippetFileName} from ${srcFilePath}`
      debug(`${chalk.red(mainSymbols.cross)} ${_snippetFileName}`)
      if (failFast) {
        throw new Error(msg)
      } else {
        console.error(msg, snippetDatas)
      }
    } else {
      // debug("Success in fetch inline content", snippetFileName, snippetDatas)
    }

    return snippetData
  }

  const fetchRecursively = (
    _snippetFileName: string,
    srcFilePath: string,
    memoKey: string,
    provenance: string[],
    nestingDepth = 0,
    inImport = false
  ) =>
    oraPromise(
      _fetchRecursively(_snippetFileName, srcFilePath, memoKey, provenance, nestingDepth, inImport),
      chalk.dim(`Fetching ${chalk.blue(_snippetFileName)}`)
    )

  const oops404 = (snippetFileName: string, errorMessage = "Failed to fetch this file") => {
    return `??? bug "Could not fetch snippet ${snippetFileName}"
${indent(errorMessage)}`
  }

  const processImport = async (
    importStmt: Import,
    srcFilePath: string,
    provenance: string[],
    isFinallyFor?: string
  ) => {
    const env = getImportEnv(importStmt)
    const group = getImportGroup(importStmt)
    const snippetFileName = getImportPath(importStmt)

    const src =
      !opts.madwizardOptions ||
      !opts.madwizardOptions.store ||
      !/^\./.test(snippetFileName) ||
      !/\//.test(snippetFileName) ||
      isAbsolute(snippetFileName) ||
      /^\./.test(snippetFileName)
        ? snippetFileName
        : join(opts.madwizardOptions.store, snippetFileName)
    const { filepath, snippetData } = await fetchRecursively(
      src,
      srcFilePath,
      memoKey + "." + group,
      provenance.concat([canonicalProvenanceOf(snippetFileName, opts.madwizardOptions)]),
      nestingDepth + 1,
      true
    )

    if (snippetData === undefined) {
      return oops404(snippetFileName)
    }

    const { attributes, body, bodyBegin } = tryFrontmatter(snippetData.trim())

    const attributesEnc = bodyBegin === 0 ? "" : Buffer.from(JSON.stringify(attributes)).toString("base64")

    // remark-directive uses ::: to indicate container directives,
    // i.e. directives that allow one to mark a block of text as
    // "contained" bythe directive, e.g.
    // :::import{key1=value1 key2=value2}
    // ...import content...
    // :::
    const colons = colonColonColon(nestingDepth)
    const title = attributes.title || group

    // note how we splice in `export FOO=bar` shell commands for any import env maps
    const setenv = !env
      ? ""
      : Object.entries(env)
          .map(([key, value]) => `\`\`\`shell\nexport ${key}="${value}"\n\`\`\``)
          .join("\n")

    const clearenv = !env
      ? ""
      : Object.keys(env)
          .map((key) => `\`\`\`shell\nunset ${key}\n\`\`\``)
          .join("\n")

    // have the provenance of this content by "store absolute", so
    // that it has the full path to the root of the store; filepath is
    // already absolute, we just need to slice off the store prefix
    const thisProvenance = canonicalProvenanceOf(filepath, opts.madwizardOptions)

    // note how we splice in `export FOO=bar` shell commands for any import env maps
    return `
${colons}import{provenance=${provenance.concat([thisProvenance])} ${
      isFinallyFor ? `isFinallyFor="${isFinallyFor}"` : ""
    } filepath=${thisProvenance} attributes="${attributesEnc}"${title ? ` title="${title}"` : ""}${
      group ? ` group="${group}"` : ""
    }}
${setenv}
${body}
${colons}
<!-- hack: working around a bug in the directive parser for ${snippetFileName} -->
${clearenv}
`
  }

  return async (data: string, srcFilePath: string, provenance: string[] = []): Promise<string> => {
    const { body, attributes } = tryFrontmatter(data)

    /** Guidebook imports from topmatter */
    const importedContent = !hasImports(attributes)
      ? undefined
      : Promise.all(attributes.imports.map((_) => processImport(_, srcFilePath, provenance))).then((_) => _.join("\n"))

    /** Guidebook finally imports from topmatter */
    const isFinallyFor = canonicalProvenanceOf(srcFilePath, opts.madwizardOptions)
    const finallyContent: string | Promise<string> = !hasFinally(attributes)
      ? ""
      : Promise.all(attributes.finally.map((_) => processImport(_, srcFilePath, provenance, isFinallyFor))).then((_) =>
          _.join("\n")
        )
    const finallyPush = !hasFinally(attributes)
      ? ""
      : `
${colonColonColon(nestingDepth)}import{provenance=fpush/${isFinallyFor} filepath=fpush/${isFinallyFor} }
${codegenFinally("push", isFinallyFor)}
${await finallyContent}
${colonColonColon(nestingDepth)}
`

    const finallyPop = !hasFinally(attributes)
      ? ""
      : `
${colonColonColon(nestingDepth)}import{provenance=fpop/${isFinallyFor} filepath=fpop/${isFinallyFor} }
${codegenFinally("pop", isFinallyFor)}
${colonColonColon(nestingDepth)}
`

    const noImportedContent = async () => !importedContent || (await importedContent).length === 0
    const noFinallyContent = async () => !finallyContent || (await finallyContent).length === 0

    const mainContent = await Promise.all(
      (includeFrontmatter ? data : body).split(/\n/).map(async (line) => {
        const matchSnippet = line.match(RE_SNIPPET)
        const match = matchSnippet || line.match(RE_INCLUDE)

        if (!match) {
          const matchImport = line.match(RE_IMPORT)
          if (matchImport) {
            const indentation = matchImport[1]
            const snippetFileName = matchImport[2]
            return indent(await processImport(snippetFileName, srcFilePath, provenance), indentation)
          } else {
            return line
          }
        } else {
          const indentation = match[1]
          const snippetFileName = matchSnippet ? match[4] : match[2]

          const { snippetData } = await fetchRecursively(
            snippetFileName,
            srcFilePath,
            memoKey,
            provenance,
            nestingDepth + 1,
            inImport
          )

          if (snippetData === undefined) {
            return line
          } else if (isError(snippetData)) {
            return oops404(snippetFileName, snippetData.message)
          } else {
            // debug("successfully fetched inlined content", snippetFileName)
            return indent(toString(snippetData), indentation)
          }
        }
      })
    ).then((_) => _.join("\n"))

    if ((await noImportedContent()) && (await noFinallyContent())) {
      return mainContent
    } else {
      const { body, bodyBegin } = tryFrontmatter(mainContent)
      const topmatter =
        !includeFrontmatter || bodyBegin === 0
          ? ""
          : mainContent
              .split(/\n/)
              .slice(0, bodyBegin - 1)
              .join("\n")

      return `${topmatter ? "\n" + topmatter + "\n---" : ""}

<!-- Begin imported content for ${srcFilePath} -->

${await finallyPush}

${(await noImportedContent()) ? "" : await importedContent}

<!-- End imported content for ${srcFilePath} -->

${body}

${await finallyPop}
`
    }
  }
}

function extractSnippetBasePath(mkdocs: unknown): string[] {
  const content = mkdocs as { markdown_extensions: object[] } //{ "pymdownx.snippets": { base_path: string[] } } }

  if (Array.isArray(content.markdown_extensions)) {
    const snippetsConfig = content.markdown_extensions.find(
      (_) => typeof _ === "object" && typeof _["pymdownx.snippets"] === "object"
    )

    if (
      snippetsConfig &&
      Array.isArray(snippetsConfig["pymdownx.snippets"].base_path) &&
      snippetsConfig["pymdownx.snippets"].base_path.every((_) => typeof _ === "string")
    ) {
      return snippetsConfig["pymdownx.snippets"].base_path
    }
  }

  return []
}

async function fetchMkdocsBasePath(opts: Options) {
  if (opts.madwizardOptions && typeof opts.madwizardOptions.mkdocs === "string") {
    try {
      const { mkdocs } = opts.madwizardOptions
      const mkdocsFilepath = /mkdocs\.ya?ml$/.test(mkdocs) ? mkdocs : join(mkdocs, "mkdocs.yml")
      const rawContent = await oraPromise(doFetch(mkdocsFilepath, opts.fetcher))

      if (typeof rawContent === "string") {
        const content = load(rawContent.replace(/: !!/g, ": redaced"))
        const mkdocsBase = /mkdocs\.ya?ml$/.test(mkdocs) ? dirname(mkdocs) : mkdocs
        return extractSnippetBasePath(content).map((_) => _.replace(/\.\/?/, mkdocsBase))
      } else {
        console.error("Error loading mkdocs", rawContent)
      }
    } catch (err) {
      console.error("Error loading mkdocs", err)
    }
  }

  // intentional fall-through
  return []
}

export default function processSnippets(opts: Options) {
  return inlineSnippets(
    Object.assign({}, opts, {
      memoKey: "",
      altBasePaths: fetchMkdocsBasePath(opts),
    })
  )
}
