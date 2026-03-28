// Oval racetrack for an 800x600 viewBox.
export const VIEWBOX = { width: 800, height: 600 }

// The track is a wide, flat oval.
// Uses cubic beziers for smooth rounded ends with long straight stretches.
// Trace: top-center → right curve → bottom straight → left curve → back to top
export const TRACK_D = [
  'M 400 180',                         // top center
  'C 600 180, 720 220, 720 300',       // right curve top half
  'C 720 380, 600 420, 400 420',       // right curve bottom half
  'C 200 420, 80 380, 80 300',         // left curve bottom half
  'C 80 220, 200 180, 400 180',        // left curve top half (close)
  'Z',
].join(' ')

// Pit stop positions — pathT values placed around the oval
export const PIT_STOP_POSITIONS = {
  microtask: {
    pathT: 0.25,
    label: 'Microtask Queue',
    anchor: { x: 720, y: 300 },        // right side, center
    labelOffset: { x: 50, y: 0 },
    color: '#ffffff',
  },
  task: {
    pathT: 0.50,
    label: 'Task Queue',
    anchor: { x: 400, y: 420 },        // bottom center
    labelOffset: { x: 0, y: 50 },
    color: '#888888',
  },
  render: {
    pathT: 0.75,
    label: 'Render',
    anchor: { x: 80, y: 300 },         // left side, center
    labelOffset: { x: -50, y: 0 },
    color: '#c0b8a8',
  },
} as const

// Web API "garage" area position (above the track)
export const GARAGE_POSITION = {
  x: 400,
  y: 40,
  label: 'Web APIs',
}

// Start/finish line position — top center
export const START_FINISH = {
  pathT: 0,
  anchor: { x: 400, y: 180 },
}
