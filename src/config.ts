import type { CommandOptions, Options } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { CODE_NAME_CHOICES, DEFAULT_OPTIONS } from './constants'

export function resolveConfig(options: CommandOptions): Options {
  options = { ...DEFAULT_OPTIONS, ...options }
  const { ide = CODE_NAME_CHOICES, ignorePaths = [] } = options

  if (options.mode === 'update' || options.mode === 'detect') {
    if (!options.path) {
      p.outro(c.red`--path is required`)
      process.exit(1)
    }
  }

  if (!ide.length) {
    p.outro(c.red`--ide is required`)
    process.exit(1)
  }

  return {
    ...DEFAULT_OPTIONS,
    ignorePaths: Array.isArray(ignorePaths) ? ignorePaths : [ignorePaths],
  } as Options
}
