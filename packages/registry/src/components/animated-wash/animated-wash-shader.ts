/*
 * Adapted from paper-design/shaders (GrainGradient concept)
 * https://github.com/paper-design/shaders — Apache-2.0.
 *
 * The visual shader for AnimatedWash, kept separate from the React mount.
 *
 * Fragment shader uniforms:
 * - u_resolution (vec2): canvas resolution in pixels
 * - u_time (float): animation time in seconds (pre-multiplied by speed)
 * - u_intensity (float): 0-1 strength of the smooth gradient under the grain
 * - u_noise (float): 0-1 grain strength over the gradient
 * - u_grain (float): grain cell size in device pixels
 * - u_lift (float): 0-1 hover lift; raises the field and brightens it
 * - u_color (vec3): wash color, sampled from currentColor at mount
 */

export const WASH_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const WASH_FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform float u_noise;
uniform float u_grain;
uniform float u_lift;
uniform vec3 u_color;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  // Dense at the bottom, dissolving upward; hover lifts the field.
  float grad = pow(clamp(1.0 - uv.y + u_lift * 0.18, 0.0, 1.0), 3.2);

  // Chunky grain cells. Each cell crossfades between its current and
  // next roll, so the field breathes instead of strobing; a per-cell
  // phase offset desynchronizes neighbours.
  vec2 cell = floor(gl_FragCoord.xy / max(u_grain, 1.0));
  float phase = hash(cell) * 6.2831;
  float t = u_time * 1.4 + phase;
  float tick = floor(t);
  float f = smoothstep(0.0, 1.0, fract(t));
  float g1 = hash(cell + vec2(tick * 0.37, tick * 0.11));
  float g2 = hash(cell + vec2((tick + 1.0) * 0.37, (tick + 1.0) * 0.11));
  float g = mix(g1, g2, f);

  // Grain survives where its roll beats the local density threshold —
  // a soft threshold, so specks fade in and out instead of popping.
  float grain = smoothstep(1.0 - grad * 0.85 - 0.12, 1.0 - grad * 0.85, g) *
    (0.35 + 0.65 * g);
  // Kept quiet: the wash is atmosphere, never a surface. Hover warms it.
  float alpha = (grad * u_intensity + grain * grad * u_noise) *
    (0.22 + u_lift * 0.14);

  gl_FragColor = vec4(u_color * alpha, alpha);
}
`;
