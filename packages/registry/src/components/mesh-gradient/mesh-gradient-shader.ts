/*
 * The visual shader for MeshGradient, kept separate from the React
 * mount.
 *
 * A recreation of the Neon brand-deck gradient: a defocused color
 * field on a near-black base, studied blob by blob from the slide —
 *
 * - a large bright yellow-green bloom left of center
 * - a golden lobe pinned to the top-right corner
 * - a burnt ember mass across the right middle
 * - deep moss green in the top-left corner
 * - the warm black base showing through between the blobs
 *
 * The source slide also carries a dark scrim along the bottom for its
 * copy; that is deliberately NOT part of the field — text protection
 * is the consumer's overlay, not the gradient's.
 *
 * Each region is a gaussian blob with its own slow orbit; a gentle
 * value-noise warp keeps the edges organic, and a fine dither kills
 * the banding that soft falloffs otherwise show on 8-bit displays.
 *
 * Fragment shader uniforms:
 * - u_resolution (vec2): canvas resolution in pixels
 * - u_time (float): animation time in seconds (pre-multiplied by speed)
 * - u_warp (float): 0-1 domain warp on the blob field
 * - u_grain (float): 0-1 dither strength
 * - u_glow (float): brightness multiplier on the bloom blob
 * - u_base / u_moss / u_ember / u_gold / u_bloom (vec3): the palette,
 *   painted in that order from back to front
 */

export const MESH_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const MESH_FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_warp;
uniform float u_grain;
uniform float u_glow;
uniform vec3 u_base;
uniform vec3 u_moss;
uniform vec3 u_ember;
uniform vec3 u_gold;
uniform vec3 u_bloom;

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

/* Gaussian falloff: 1 at the center, soft shoulder, long tail. The
   stretch squashes distance per axis, elongating the blob. */
float blob(vec2 p, vec2 center, float radius, vec2 stretch) {
  vec2 d = (p - center) / stretch;
  return exp(-dot(d, d) / (radius * radius));
}

/* A slow elliptical orbit unique to each blob. */
vec2 orbit(float t, float phase, float amount) {
  return vec2(cos(t * 0.11 + phase), sin(t * 0.07 + phase * 1.7)) * amount;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;

  // Organic edges: push the sample point around with slow value noise.
  vec2 warp = vec2(
    vnoise(p * 1.4 + vec2(t * 0.03, 0.0)),
    vnoise(p * 1.4 + vec2(7.3, t * 0.025))
  );
  p += (warp - 0.5) * u_warp * 0.55;

  // Paint back to front, each blob mixing toward its own color; the
  // moss corner goes last so the bloom's halo never washes it out.
  vec3 color = u_base;

  float gold = blob(
    p, vec2(1.02 * aspect, 1.0) + orbit(t, 4.2, 0.04), 0.62, vec2(1.15, 1.0));
  color = mix(color, u_gold, min(gold * 1.1, 1.0));

  float bloom = blob(
    p, vec2(0.36 * aspect, 0.64) + orbit(t, 5.6, 0.06), 0.55, vec2(1.3, 1.0));
  color = mix(color, u_bloom * u_glow, min(bloom * 1.25, 1.0));

  float ember = blob(
    p, vec2(0.78 * aspect, 0.46) + orbit(t, 2.1, 0.05), 0.55, vec2(1.2, 1.0));
  color = mix(color, u_ember, min(ember * 0.9, 1.0));

  float moss = blob(
    p, vec2(0.0, 1.06) + orbit(t, 0.0, 0.03), 0.42, vec2(1.0, 1.25));
  color = mix(color, u_moss, min(moss * 0.95, 1.0));

  // Fine dither so the soft falloffs don't band on 8-bit displays.
  color += (hash(gl_FragCoord.xy) - 0.5) * (u_grain * 0.035);

  gl_FragColor = vec4(color, 1.0);
}
`;
