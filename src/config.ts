import type { CommandOptions, Options } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { CODE_NAME_CHOICES } from './constants'

export function resolveConfig(options: CommandOptions): Options {
  const { path, ide = CODE_NAME_CHOICES, overwrite = true, ignorePaths = [] } = options

  if (!path) {
    p.outro(c.red`--path is required`)
    process.exit(1)
  }
  if (!ide.length) {
    p.outro(c.red`--ide is required`)
    process.exit(1)
  }

  return {
    path,
    ide,
    overwrite,
    ignorePaths: Array.isArray(ignorePaths) ? ignorePaths : [ignorePaths],
  } as Options
}
