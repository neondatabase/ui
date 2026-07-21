/*
 * The visual shader for DotMatrixWave, kept separate from the React
 * mount.
 *
 * A field of dots breathing in a smooth noise wave: the dot-matrix
 * world map from RegionSelect, generalized into a background surface.
 * Each dot's size and brightness ride a drifting value-noise field, so
 * broad swells roll across the grid instead of dots blinking in
 * unison.
 *
 * Fragment shader uniforms:
 * - u_resolution (vec2): canvas resolution in pixels
 * - u_time (float): animation time in seconds (pre-multiplied by speed)
 * - u_gap (float): dot pitch in device pixels
 * - u_dot (float): 0-1 dot radius as a share of the pitch
 * - u_amplitude (float): 0-1 how hard the wave swells the dots
 * - u_floor (float): 0-1 minimum brightness of resting dots
 * - u_stop_count (int): number of live gradient stops (up to 6)
 * - u_stops[6] (vec3): gradient stops, spread evenly left to right;
 *   a single stop paints the whole field flat (currentColor default)
 */

export const DOT_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const DOT_FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_gap;
uniform float u_dot;
uniform float u_amplitude;
uniform float u_floor;
uniform int u_stop_count;
uniform vec3 u_stops[6];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = smoothstep(0.0, 1.0, fract(p));
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Piecewise-linear gradient across evenly spread stops.
vec3 gradientAt(float t) {
  vec3 color = u_stops[0];
  float span = max(float(u_stop_count - 1), 1.0);

  for (int i = 1; i < 6; i++) {
    if (i >= u_stop_count) {
      break;
    }

    float a = float(i - 1) / span;
    float b = float(i) / span;
    color = mix(color, u_stops[i], smoothstep(a, b, t));
  }

  return color;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_gap);
  vec2 local = fract(gl_FragCoord.xy / u_gap) - 0.5;

  // Two octaves of drifting noise: a broad swell plus finer chop, each
  // sliding in its own direction so the field never loops visibly.
  float swell = vnoise(cell * 0.08 + vec2(u_time * 0.25, u_time * 0.1));
  float chop = vnoise(cell * 0.3 - vec2(u_time * 0.15, u_time * 0.3));
  float wave = swell * 0.7 + chop * 0.3;

  // The wave swells both radius and brightness; resting dots keep a
  // faint floor so the grid never fully disappears.
  float energy = u_floor + (1.0 - u_floor) * pow(wave, 1.6) * u_amplitude +
    (1.0 - u_amplitude) * (1.0 - u_floor) * 0.25;
  float radius = u_dot * 0.5 * (0.55 + 0.45 * wave * u_amplitude +
    0.45 * (1.0 - u_amplitude));

  float d = length(local);
  float aa = 1.0 / u_gap;
  float disc = 1.0 - smoothstep(radius - aa, radius + aa, d);

  // Each dot takes one flat tone from the gradient at its cell center.
  vec3 color = gradientAt(((cell.x + 0.5) * u_gap) / u_resolution.x);

  float alpha = disc * energy;
  gl_FragColor = vec4(color * alpha, alpha);
}
`;
