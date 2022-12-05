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

export function isUrl(a: string) {
  return /^https?:/.test(a)
}

/**
 * For example, transform A to B:
 * A: https://github.com/org/repo/blob/branch/path
 * B: https://raw.githubusercontent.com/org/repo/branch/path
 */
export function toRawGithubUserContent(uri: string) {
  const re = /^https:\/\/github.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  const match = uri.match(re)

  if (!match) {
    return uri
  } else {
    const [org, repo, branch, path] = match.slice(1)
    return `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${path}`
  }
}
