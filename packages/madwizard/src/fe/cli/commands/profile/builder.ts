/*
 * Copyright 2023 The Kubernetes Authors
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

import { Argv } from "yargs"

import Opts from "../../options.js"
import { group } from "../../strings.js"

type NamedProfileOpts = Opts & {
  profile: string
}

type UriOpts = Opts & {
  uri: string
  force: boolean
}

type SrcProfileOpts = {
  srcProfile: string
}

type TargetProfileOpts = {
  dstProfile: string
}

export function namedProfileBuilder(yargs: Argv<Opts>): Argv<NamedProfileOpts> {
  return yargs.positional("profile", {
    type: "string",
    describe: "Name of a profile",
  })
}

export function uriBuilder(yargs: Argv<Opts>): Argv<UriOpts> {
  return yargs
    .positional("uri", {
      type: "string",
      describe: "URI of profile",
    })
    .options({
      name: {
        alias: "n",
        type: "string" as const,
        group: group("Profile Options"),
        describe: "Save the profile with the given name",
      },
      force: {
        alias: "f",
        default: false,
        type: "boolean" as const,
        group: group("Profile Options"),
        describe: "Force overwrite an existing profile",
      },
    })
}

export function srcAndTargetNamedProfileBuilder(yargs: Argv<Opts>): Argv<SrcProfileOpts & TargetProfileOpts> {
  return yargs
    .positional("srcProfile", {
      type: "string",
      describe: "Name of source profile",
    })
    .positional("dstProfile", {
      type: "string",
      describe: "Name of target profile",
    })
}
