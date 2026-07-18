/*
 * The visual shader for NeonAurora, kept separate from the React mount.
 *
 * A clean-room recreation of the neon.com hero video background, built
 * from frame-by-frame study of the source footage:
 *
 * - ~110 wide, soft-edged bar columns across the frame width
 * - rectangular blocks of contiguous lit bars that live for seconds,
 *   plus sparse solo bars between them
 * - near-static geometry: a creep of a pixel or two per second, no zoom
 * - a fast subtle shimmer on every lit bar, every frame
 * - one warm flare at a time, a short block that swells and dies
 * - a fine halftone screen over everything, and a blurred foreground
 *   wash as a second depth layer
 *
 * Fragment shader uniforms:
 * - u_resolution (vec2): canvas resolution in pixels
 * - u_time (float): animation time in seconds (pre-multiplied by speed)
 * - u_density (float): 0-1 share of blocks alive at once
 * - u_intensity (float): overall brightness multiplier
 * - u_blur (float): 0-1 blur on the foreground wash layer
 * - u_glare (float): 0-1 ambient bloom fog around lit regions
 * - u_flare (float): 0-1 how often the warm flare ignites
 * - u_color1/2/3 (vec3): the bar palette, mixed per bar
 */

export const AURORA_VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const AURORA_FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_density;
uniform float u_intensity;
uniform float u_blur;
uniform float u_glare;
uniform float u_flare;
uniform float u_thickness;
uniform float u_white_flare;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

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

// A value that wanders smoothly per cell on its own desynced clock:
// random phase and rate, so no two cells change in unison.
float roll(vec2 cell, float t) {
  float rate = 0.6 + 1.2 * hash(cell * 1.7 + 9.3);
  float tt = t * rate + hash(cell * 3.3 + 1.1) * 7.0;
  float tick = floor(tt);
  float f = smoothstep(0.0, 1.0, fract(tt));
  float a = hash(cell + tick * vec2(0.37, 0.11));
  float b = hash(cell + (tick + 1.0) * vec2(0.37, 0.11));
  return mix(a, b, f);
}

// One flare event stream: a block of bars that ignites, swells, and
// dies bar by bar. freq drives how often; ofs desyncs streams so warm
// and white flares never share a clock or a position.
float flare(float col, vec2 uv, float period, float freq, float ofs, float seed) {
  float gt = u_time * (0.06 + 0.26 * freq) + seed * 0.37 + ofs;
  float gTick = floor(gt);
  float gF = fract(gt);
  float has = step(1.0 - 0.95 * freq, hash(vec2(gTick, seed + 51.3 + ofs))) *
    step(0.001, freq);
  float heroCol = floor(hash(vec2(gTick, 5.5 + seed + ofs)) * (u_resolution.x / period)) +
    seed * 97.0;
  float heroY = 0.3 + hash(vec2(gTick, 8.2 + seed + ofs)) * 0.4;
  float gx = exp(-abs(col - heroCol) * 0.55) * has;
  // Per-bar onset and span stagger the ignition and the decay.
  float onset = hash(vec2(col, gTick + 17.0 + ofs)) * 0.25;
  float span = 0.45 + hash(vec2(col, gTick + 29.0 + ofs)) * 0.5;
  float phase = clamp((gF - onset) / span, 0.0, 1.0);
  float swell = sin(phase * 3.14159);
  float gdy = (uv.y - heroY) / (0.1 + span * 0.14);
  return gx * swell * exp(-gdy * gdy);
}

// One depth layer of the bar field. Returns premultiplied color in
// rgb and coverage in a.
vec4 field(vec2 px, float seed, float blur) {
  vec2 uv = px / u_resolution;

  // ~110 wide soft columns across the width, like the source.
  float period = max(u_resolution.x / 110.0, 6.0);
  float col = floor(px.x / period) + seed * 97.0;
  float duty = fract(px.x / period);

  // A glowing-tube profile: soft shoulders, bright core. Thickness
  // sets how much of the period the tube fills; blur melts the edges.
  float w = 0.3 + 0.5 * u_thickness;
  float start = (1.0 - w) * 0.5;
  float end = (1.0 + w) * 0.5;
  float shoulder = 0.1 + blur * 0.2;
  float profile = smoothstep(start - shoulder * 0.3, start + shoulder, duty) *
    (1.0 - smoothstep(end - shoulder, end + shoulder * 0.3, duty));

  // Irregular rows: five bands whose boundaries shift per column stretch.
  float coarse = floor(px.x / (period * 10.0));
  float row = floor(uv.y * 5.0 + (hash(vec2(coarse, 7.7)) - 0.5) * 0.7);

  // Blocks: runs of bars with wobbled boundaries, any width from a few
  // bars to dozens. Each block lives for seconds, then yields.
  float bx = px.x / (period * 14.0);
  bx += (vnoise(vec2(bx * 0.6, row * 3.7 + seed * 11.0)) - 0.5) * 1.6;
  vec2 block = vec2(floor(bx) + seed * 31.0, row);
  float life = roll(block * 3.7, u_time * 0.14 + seed);
  float blockOn = smoothstep(1.0 - u_density - 0.05, 1.0 - u_density + 0.05, life);

  // The block rectangle: hard-ish top and bottom, height varying
  // widely between blocks, bottoms slightly ragged per bar.
  float blockCenter = (row + 0.5) / 5.0 + (hash(block * 1.9) - 0.5) * 0.12;
  float blockHalf = (0.03 + 0.11 * pow(hash(block * 2.3 + 5.1), 1.4)) *
    (0.85 + 0.3 * hash(vec2(col, 3.3)));
  float dy = abs(uv.y - blockCenter);
  float rect = 1.0 - smoothstep(blockHalf * 0.8, blockHalf, dy);

  // Solo bars: sparse loners between the blocks with their own clocks,
  // shorter, some just dashed stubs.
  float soloPick = step(0.86, hash(vec2(col, 91.3 + row)));
  float soloLife = roll(vec2(col, row + 61.0), u_time * 0.2 + seed);
  float soloOn = smoothstep(0.62, 0.75, soloLife) * soloPick;
  float soloCenter = (row + 0.5) / 5.0 + (hash(vec2(col, 27.9)) - 0.5) * 0.16;
  float soloHalf = 0.012 + 0.05 * pow(hash(vec2(col, 14.2)), 2.0);
  float sdy = (uv.y - soloCenter) / soloHalf;
  float soloEnv = exp(-sdy * sdy);

  float coverage = max(blockOn * rect, soloOn * soloEnv);

  // Per-bar brightness: a slow breath plus the fast shimmer the source
  // has on every lit bar, every frame.
  float breath = 0.55 + 0.45 * roll(vec2(col, row), u_time * 0.5 + seed);
  float ft = u_time * 9.0 + hash(vec2(col, 41.7)) * 4.0;
  float flick = mix(
    hash(vec2(col, floor(ft))),
    hash(vec2(col, floor(ft) + 1.0)),
    smoothstep(0.0, 1.0, fract(ft))
  );
  float glow = breath * (0.78 + 0.35 * flick);

  // Halftone screen in device pixels; blur washes it out.
  float checker = mod(
    floor(gl_FragCoord.x / 1.5) + floor(gl_FragCoord.y / 1.5),
    2.0
  );
  float dither = mix(0.6 + 0.4 * checker, 1.0, blur * 0.8);

  // Palette per bar, biased toward the luminous middle of the ramp.
  float hue = 0.12 + 0.6 * hash(vec2(col * 1.3, row * 7.1));
  vec3 color = hue < 0.5
    ? mix(u_color1, u_color2, hue * 2.0)
    : mix(u_color2, u_color3, hue * 2.0 - 1.0);

  // TWO FLARE STREAMS on independent clocks: the warm amber block
  // (u_flare) and the rarer hot white one (u_white_flare).
  float warmBody = flare(col, uv, period, u_flare, 0.0, seed) * profile * dither;
  float whiteRaw = flare(col, uv, period, u_white_flare, 43.7, seed);
  float whiteBody = whiteRaw * profile * dither;
  // The white flare blooms: a soft halo that spills past the bar mask
  // and fills the gaps between tubes with haze.
  float whiteGlow = pow(whiteRaw, 0.6) * 0.35;

  vec3 warm = mix(vec3(1.0, 0.93, 0.78), u_color2, 0.25);
  // Warm white, leaning yellow — hot filament, not fluorescent.
  vec3 white = vec3(1.0, 0.96, 0.72);

  // Ambient bloom fog hugging the lit mass, dithered against banding.
  vec2 fogCoord = vec2(px.x / (period * 30.0), uv.y * 2.6);
  float fogField = vnoise(fogCoord + vec2(u_time * 0.03 + seed, seed * 3.1));
  float fogJitter = (hash(gl_FragCoord.xy) - 0.5) * 0.06;
  float fog = smoothstep(0.5 + fogJitter, 0.95, fogField) * u_glare * 0.12;
  vec3 fogTint = mix(u_color1, u_color2, 0.45) * 0.8;

  float crisp = profile * coverage * glow * dither;
  float alpha = crisp + warmBody + whiteBody + whiteGlow + fog;

  return vec4(
    color * crisp * 1.6 + warm * warmBody * 1.5 +
      white * (whiteBody * 1.7 + whiteGlow * 0.8) + fogTint * fog,
    alpha
  );
}

void main() {
  // A slow, constant dolly toward the viewer: two copies of the field
  // an octave apart scale up forever, crossfading as they trade places,
  // so the approach never resets. A gentle sine wander rides along.
  vec2 origin = u_resolution * 0.5;
  float total = u_time * 0.025;
  vec4 acc = vec4(0.0);
  float weightSum = 0.0;

  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float phase = fract(total + fk * 0.5);
    float life = floor(total + fk * 0.5);
    float scale = pow(2.0, phase);
    float weight = sin(phase * 3.14159);
    float drift = u_time * (0.8 + fk * 1.2) +
      sin(u_time * (0.05 + fk * 0.04) + fk * 2.7) * 24.0;
    vec2 px = origin + (gl_FragCoord.xy - origin) / scale;
    px.x += drift;
    // Depth of field: the near (large) end of a layer's life blurs.
    float layerBlur = u_blur * smoothstep(0.45, 1.0, phase);
    acc += field(px, life * 2.0 + fk, layerBlur) * weight;
    weightSum += weight;
  }

  vec4 bars = acc / max(weightSum, 0.001);

  // Opaque over black: the field is its own backdrop, so screenshots,
  // recordings, and the page all see the same image.
  vec3 outColor = min(bars.rgb, vec3(1.0)) * u_intensity;
  gl_FragColor = vec4(outColor, 1.0);
}
`;
