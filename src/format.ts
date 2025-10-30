/* eslint-disable no-console */
import type { HistoryEntry } from './types'
import * as p from '@clack/prompts'
import { JSON_MARKER } from './constants'

export function outputHistories(data: HistoryEntry[], json: boolean = false) {
  if (!data.length)
    return

  if (json) {
    console.log(JSON_MARKER)
    console.log(JSON.stringify(data, null, 2))
    console.log(JSON_MARKER)
  }
  else {
    p.note(data.map(i => `- ${i.folderUri}`).join('\n'))
  }
}
