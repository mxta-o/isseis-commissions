// The gallery's works, read straight from src/assets/gallery/<category>/<file>.
//   - the folder sets the category: characters/ -> CHARACTER, scenes/ -> SCENE, chibi/ -> CHIBI
//   - the filename becomes the title: "moonlight-knight.webp" -> "MOONLIGHT KNIGHT"
//   - a leading number only controls the order and is hidden: "01-moonlight-knight.webp"
//   - a leading "fan_" or "fan-" marks fan art, which gets a credit line: "fan_marvin_sketch.webp"
// Drop a file in the right folder and it shows up; no code change needed.

const FILES = import.meta.glob<string>('../assets/gallery/*/*.{webp,jpg,jpeg,png,avif}', { eager: true, import: 'default' })

const FOLDER_TAG = { characters: 'CHARACTER', scenes: 'SCENE', chibi: 'CHIBI' } as const
export type WorkTag = (typeof FOLDER_TAG)[keyof typeof FOLDER_TAG]

export type Work = {
  n: string        // "01", "02", ... unique id, in display order
  label: string    // title, upper case
  tag: WorkTag
  src: string
  fan: boolean
}

type Parsed = Omit<Work, 'n'> & { sortKey: string }

function parse(path: string, src: string): Parsed | null {
  const parts = path.split('/')
  const folder = parts[parts.length - 2] as keyof typeof FOLDER_TAG
  const tag = FOLDER_TAG[folder]
  if (!tag) {
    if (import.meta.env.DEV) console.warn(`gallery: "${path}" is in an unknown folder (use characters, scenes or chibi)`)
    return null
  }
  let name = parts[parts.length - 1].replace(/\.[^.]+$/, '')
  const fan = /^fan[-_]/i.test(name)
  if (fan) name = name.replace(/^fan[-_]/i, '')
  const sortKey = name.toLowerCase()
  const label = name.replace(/^\d+[-_\s]+/, '').replace(/[-_]+/g, ' ').trim().toUpperCase()
  return { label: label || 'UNTITLED', tag, src, fan, sortKey }
}

export const WORKS: Work[] = Object.entries(FILES)
  .map(([path, src]) => parse(path, src))
  .filter((w): w is Parsed => w !== null)
  .sort((a, b) => a.sortKey.localeCompare(b.sortKey, undefined, { numeric: true }))
  .map(({ sortKey: _sortKey, ...w }, i) => ({ ...w, n: String(i + 1).padStart(2, '0') }))

// the categories the gallery can be filtered by, shared by the desktop list and the phone's camera roll
export const CATEGORIES = [
  { key: 'ALL', name: 'All Works' },
  { key: 'CHARACTER', name: 'Characters' },
  { key: 'SCENE', name: 'Scenes' },
  { key: 'CHIBI', name: 'Chibi' },
] as const
export type CategoryKey = (typeof CATEGORIES)[number]['key']

export const worksIn = (cat: CategoryKey): Work[] => (cat === 'ALL' ? WORKS : WORKS.filter(w => w.tag === cat))
