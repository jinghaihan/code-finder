import type { CODE_NAME_CHOICES } from './constants'

export type CodeName = (typeof CODE_NAME_CHOICES)[number]

export interface CommandOptions {
  path?: string
  overwrite?: boolean
  ide?: CodeName[]
  ignorePaths?: string | string[]
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
