/* eslint-disable no-console */
import type { HistoryEntry } from './types'
import * as p from '@clack/prompts'
import c from 'ansis'
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
    const lines = data.map((i) => {
      const path = i.path || i.folderUri || i.fileUri
      return `- ${path}${i.branch ? c.reset` (${c.green(i.branch)})` : ''}`
    })
    p.note(lines.join('\n'))
  }
}
