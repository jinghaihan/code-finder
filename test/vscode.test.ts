import { expect, it, vi } from 'vitest'
import { uniqVSCodeHistories } from '../src/database/vscode'

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}))

it('should uniq VSCode histories', () => {
  const uniqHistories = uniqVSCodeHistories([
    [
      { folderUri: 'file:///path/to/folder1' },
      { folderUri: 'file:///path/to/folder2' },
      { fileUri: 'file:///path/to/file1' },
    ],
    [
      { folderUri: 'file:///path/to/folder1' },
      { fileUri: 'file:///path/to/file1' },
      { fileUri: 'file:///path/to/file2' },
    ],
  ])
  expect(uniqHistories).toEqual([
    { folderUri: 'file:///path/to/folder1' },
    { folderUri: 'file:///path/to/folder2' },
    { fileUri: 'file:///path/to/file1' },
    { fileUri: 'file:///path/to/file2' },
  ])
})
