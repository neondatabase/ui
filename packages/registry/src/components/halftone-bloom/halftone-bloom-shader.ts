/*
 * The visual shader for HalftoneBloom, kept separate from the React
 * mount.
 *
 * A punched-metal halftone screen revealed by soft color lights: every
 * cell is a ring (a disc with a smaller hole punched off-center), and
 * the only light in the scene is a configurable set of blurred blobs
 * drifting behind the screen. Where a light burns hottest it can
 * overexpose toward a highlight cream, the way the reference art blows
 * out at its center.
 *
 * Each ring samples the light field once at its cell center, so a ring
 * reads as one flat tone and the gradient steps cell by cell, which is
 * what sells the print-halftone look.
 *
 * Fragment shader uniforms:
 * - u_resolution (vec2): canvas resolution in pixels
 * - u_time (float): animation time in seconds (pre-multiplied by speed)
 * - u_gap (float): cell pitch in device pixels
 * - u_hole (float): 0-1 punched-hole radius as a share of the cell
 * - u_hole_offset (vec2): hole offset from the cell center
 * - u_intensity (float): overall light brightness multiplier
 * - u_drift (float): 0-1 how far lights wander from their anchors
 * - u_highlight (vec3): the overexposed highlight color
 * - u_count (int): number of live lights (up to 6)
 * - u_pos[6] (vec2): light anchors; x across the width, y up the
 *   height, both 0-1
 * - u_col[6] (vec3): light colors
 * - u_rad[6] (float): light radii as a share of the width
 * - u_gain[6] (float): light brightness gains
 * - u_over[6] (float): 0-1 per-light pull toward the highlight
 */

export const BLOOM_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const BLOOM_FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_gap;
uniform float u_hole;
uniform vec2 u_hole_offset;
uniform float u_intensity;
uniform float u_drift;
uniform vec3 u_highlight;
uniform int u_count;
uniform vec2 u_pos[6];
uniform vec3 u_col[6];
uniform float u_rad[6];
uniform float u_gain[6];
uniform float u_over[6];

void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_gap);
  vec2 local = fract(gl_FragCoord.xy / u_gap) - 0.5;

  // Sample the light field at the cell center so each ring is one
  // flat tone. Everything lives in width units: x runs 0-1 across,
  // y runs 0-1/aspect up, so lights stay circular in pixels and a
  // rig reads the same on any canvas shape.
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = ((cell + 0.5) * u_gap) / u_resolution.x;
  float t = u_time * 0.5;

  // Accumulate the lights: each wanders its own lissajous path and
  // breathes its radius so the field visibly lives.
  float total = 0.0;
  vec3 acc = vec3(0.0);
  float over = 0.0;

  for (int i = 0; i < 6; i++) {
    if (i >= u_count) {
      break;
    }

    float fi = float(i);
    vec2 center = vec2(u_pos[i].x, u_pos[i].y / aspect) +
      u_drift * vec2(
        0.12 * sin(t * (0.5 + 0.13 * fi) + fi * 1.7),
        0.1 * cos(t * (0.7 + 0.11 * fi) + fi * 2.3) / aspect
      );
    float radius = u_rad[i] *
      (1.0 + 0.15 * u_drift * sin(t * (0.4 + 0.09 * fi) + fi));
    vec2 d = uv - center;
    float energy = exp(-dot(d, d) / (radius * radius)) * u_gain[i];

    total += energy;
    acc += u_col[i] * energy;
    over += energy * u_over[i];
  }

  float light = total * u_intensity;
  float sum = max(total, 0.001);
  vec3 tone = acc / sum;

  // Overexposure: the hottest cells of lights that opt in lift toward
  // the highlight cream; the rest stay saturated like the reference.
  tone = mix(tone, u_highlight, smoothstep(0.9, 1.7, light) * (over / sum));
  tone *= min(light, 1.0);

  // The ring: a disc filling the cell with a hole punched off-center,
  // leaving the little crescent the reference art has.
  float aa = 1.5 / u_gap;
  float disc = 1.0 - smoothstep(0.5 - aa, 0.5, length(local));
  float hole = 1.0 -
    smoothstep(u_hole - aa, u_hole + aa, length(local - u_hole_offset));
  float ring = disc * (1.0 - hole);

  float alpha = ring * min(light, 1.0);
  gl_FragColor = vec4(tone * ring, alpha);
}
`;
