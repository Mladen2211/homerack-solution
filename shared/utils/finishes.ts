// Single source of truth for the three cabinet finishes — the swatch hex values are
// referenced by the 3D viewer's materials, the footer swatches, and the room-mood
// panel, which previously each hardcoded their own copy.
export type Finish = 'raw' | 'white' | 'black'

export const FINISH_COLORS: Record<Finish, string> = {
  raw: '#cfd3da',
  white: '#f1f0ec',
  black: '#232529',
}

export type Variant = 'R1' | 'R5'
