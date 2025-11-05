import type { CommandOptions, Options } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { resolve } from 'pathe'
import tildify from 'tildify'
import { CODE_NAME_CHOICES, DEFAULT_OPTIONS } from './constants'

export async function resolveConfig(options: CommandOptions): Promise<Options> {
  options = { ...DEFAULT_OPTIONS, ...options }
  const { ide = CODE_NAME_CHOICES, ignorePaths = [] } = options

  if (options.mode === 'update' || options.mode === 'detect') {
    if (!options.cwd && !options.yes) {
      const result = await p.confirm({
        message: `Use ${c.yellow(tildify(process.cwd()))} as the working directory?`,
        initialValue: true,
      })
      if (p.isCancel(result)) {
        p.outro(c.red`aborting`)
        process.exit(1)
      }
      options.cwd = process.cwd()
    }
  }

  if (!ide.length) {
    p.outro(c.red`--ide is required`)
    process.exit(1)
  }

  return {
    ...options,
    mode: options.mode || 'update',
    cwd: options.cwd ? resolve(options.cwd) : undefined,
    ide,
    ignorePaths: Array.isArray(ignorePaths) ? ignorePaths : [ignorePaths],
    mtimeDeep: (options.mtimeDeep || options.mtimeDeep === 0)
      ? Number(options.mtimeDeep)
      : DEFAULT_OPTIONS.mtimeDeep,
    mtimeConcurrency: options.mtimeConcurrency
      ? Number(options.mtimeConcurrency)
      : DEFAULT_OPTIONS.mtimeConcurrency,
  } as Options
}
