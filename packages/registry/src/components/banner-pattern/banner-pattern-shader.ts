/*
 * The visual shader for BannerPattern, kept separate from the React
 * mount.
 *
 * A recreation of neon.com's banner-pattern.svg, which builds its dot
 * field in two layers:
 *
 * - a color field of big blurred gradient ellipses — Neon green
 *   upper-left, sage bridging the middle, amber strengthening right,
 *   a cream hot spot in the top-right corner, rust pooling low
 * - a square-dot grid used as an alpha MASK over that field, so each
 *   dot simply samples whatever color sits behind it
 *
 * On top of the mask the source adds fractal-noise grain and a faint
 * unmasked glow; here that becomes per-dot brightness jitter and a
 * dim ambient haze of the same field behind the dots.
 *
 * Fragment shader uniforms:
 * - u_resolution (vec2): canvas resolution in pixels
 * - u_time (float): animation time in seconds (pre-multiplied by speed)
 * - u_cell (float): grid cell size in device pixels
 * - u_dot (float): 0-0.5 dot half-width as a fraction of the cell
 * - u_haze (float): 0-1 unmasked ambient glow strength
 * - u_jitter (float): 0-1 per-dot brightness variance
 * - u_base / u_green / u_sage / u_amber / u_cream / u_rust (vec3):
 *   the palette, painted back to front
 */

export const BANNER_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const BANNER_FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_cell;
uniform float u_dot;
uniform float u_haze;
uniform float u_jitter;
uniform vec3 u_base;
uniform vec3 u_green;
uniform vec3 u_sage;
uniform vec3 u_amber;
uniform vec3 u_cream;
uniform vec3 u_rust;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

/* Gaussian falloff, elongated by the per-axis stretch. */
float blob(vec2 p, vec2 center, float radius, vec2 stretch) {
  vec2 d = (p - center) / stretch;
  return exp(-dot(d, d) / (radius * radius));
}

/* A slow elliptical orbit unique to each blob — fast enough that the
   dots visibly change color at speed 1 and clearly flow at speed 3. */
vec2 orbit(float t, float phase, float amount) {
  return vec2(cos(t * 0.3 + phase), sin(t * 0.2 + phase * 1.7)) * amount;
}

/* The color field the dots sample — blobs painted back to front. */
vec3 field(vec2 p, float aspect, float t) {
  vec3 color = u_base;

  float green = blob(
    p, vec2(0.22 * aspect, 0.98) + orbit(t, 0.0, 0.09), 0.55, vec2(1.2, 1.0));
  color = mix(color, u_green, min(green * 0.85, 1.0));

  float sage = blob(
    p, vec2(0.52 * aspect, 0.72) + orbit(t, 1.9, 0.1), 0.45, vec2(1.2, 1.0));
  color = mix(color, u_sage, min(sage * 0.6, 1.0));

  float amber = blob(
    p, vec2(0.86 * aspect, 0.78) + orbit(t, 3.4, 0.09), 0.5, vec2(1.1, 1.1));
  color = mix(color, u_amber, min(amber * 0.9, 1.0));

  float cream = blob(
    p, vec2(1.03 * aspect, 1.02) + orbit(t, 4.8, 0.06), 0.24, vec2(1.0, 1.0));
  color = mix(color, u_cream, min(cream * 0.9, 1.0));

  float rust = blob(
    p, vec2(0.92 * aspect, 0.12) + orbit(t, 5.9, 0.09), 0.45, vec2(1.35, 1.0));
  color = mix(color, u_rust, min(rust * 0.6, 1.0));

  return color;
}

/* An antialiased square dot centered in each grid cell. */
float dotMask(vec2 fragPx, float cell, float halfWidth) {
  vec2 f = abs(fract(fragPx / cell) - 0.5);
  float aa = 1.0 / cell;
  return smoothstep(halfWidth + aa, halfWidth - aa, f.x) *
    smoothstep(halfWidth + aa, halfWidth - aa, f.y);
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  vec3 sampled = field(p, aspect, t);

  // Per-dot brightness jitter, the shader's stand-in for the source's
  // fractal-noise grain: each cell keeps its own fixed variance.
  vec2 cellId = floor(gl_FragCoord.xy / u_cell);
  float jitter = mix(1.0 - u_jitter * 0.5, 1.0, hash(cellId));

  float mask = dotMask(gl_FragCoord.xy, u_cell, u_dot);

  // The dots sample the field; a dim haze of the same field sits
  // behind them, like the source's unmasked glow ellipse.
  vec3 color = sampled * (u_haze * 0.18) + sampled * mask * jitter;

  gl_FragColor = vec4(color, 1.0);
}
`;
