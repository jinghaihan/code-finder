import type { CODE_NAME_CHOICES, MODE_CHOICES } from './constants'

export type RangeMode = (typeof MODE_CHOICES)[number]

export type CodeName = (typeof CODE_NAME_CHOICES)[number]

export interface CommandOptions {
  mode?: RangeMode
  path?: string
  ide?: CodeName[]
  ignorePaths?: string | string[]
  gitBranch?: boolean
  overwrite?: boolean
  json?: boolean
}

export interface Options extends Required<Omit<CommandOptions, 'ignorePaths'>> {
  ignorePaths: string[]
}

export interface History {
  entries: HistoryEntry[]
}

export interface HistoryEntry {
  folderUri?: string
  fileUri?: string
}
