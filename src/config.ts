import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { CODE_NAME_CHOICES } from './constants'

export function resolveConfig(options: CommandOptions): Required<CommandOptions> {
  const { path, ide = CODE_NAME_CHOICES, overwrite = true } = options

  if (!path) {
    p.outro(c.red`--path is required`)
    process.exit(1)
  }
  if (!ide.length) {
    p.outro(c.red`--ide is required`)
    process.exit(1)
  }

  return { path, ide, overwrite } as Required<CommandOptions>
}
