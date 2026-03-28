// Figure-eight track for an 800x600 viewBox.
export const VIEWBOX = { width: 800, height: 600 }

// The track is a lemniscate (figure-eight / infinity symbol) shape.
// Single continuous path that crosses itself at the center.
// Uses cubic beziers to approximate the shape.
// Trace: center → right lobe (clockwise) → center → left lobe (clockwise) → center
export const TRACK_D = [
  'M 400 300',
  'C 500 200, 700 120, 700 300',  // up-right, around right lobe
  'C 700 480, 500 400, 400 300',  // back down to center
  'C 300 200, 100 120, 100 300',  // up-left, around left lobe
  'C 100 480, 300 400, 400 300',  // back down to center
].join(' ')

// Pit stop positions — pathT values correspond to PIT_STOPS in simulation.ts
export const PIT_STOP_POSITIONS = {
  microtask: {
    pathT: 0.25,
    label: 'Microtask Queue',
    anchor: { x: 700, y: 200 },      // right lobe, upper area
    labelOffset: { x: 40, y: -30 },
    color: 'var(--color-neon-green)',
  },
  task: {
    pathT: 0.50,
    label: 'Task Queue',
    anchor: { x: 400, y: 420 },      // center-bottom
    labelOffset: { x: 0, y: 40 },
    color: 'var(--color-neon-yellow)',
  },
  render: {
    pathT: 0.75,
    label: 'Render',
    anchor: { x: 100, y: 200 },      // left lobe, upper area
    labelOffset: { x: -40, y: -30 },
    color: 'var(--color-neon-pink)',
  },
} as const

// Web API "garage" area position (off-track, above center)
export const GARAGE_POSITION = {
  x: 400,
  y: 40,
  label: 'Web APIs',
}

// Start/finish line position
export const START_FINISH = {
  pathT: 0,
  anchor: { x: 400, y: 300 },
}
