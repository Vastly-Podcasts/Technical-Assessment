/**
 * compositingCurves.ts
 *
 * Blend curve functions for mask-based compositing.
 *
 * ============================================================================
 * THE COMPOSITING PROBLEM
 * ============================================================================
 *
 * When blending person (original) and background (filtered) using a mask,
 * the transition at edges can look harsh or unnatural. The blend curve
 * determines how mask values (0-1) map to blend factors.
 *
 * Basic formula: output = original × blend + filtered × (1 - blend)
 *
 * The question is: how do we compute `blend` from the mask value?
 *
 * ============================================================================
 * CURVE CHARACTERISTICS
 * ============================================================================
 *
 * Linear:       Harsh edges, fast compute
 * Smoothstep:   S-curve, good balance (current default)
 * Smootherstep: Flatter at extremes, smoother transitions
 * Cosine:       Natural wave-like falloff
 * Sigmoid:      Adjustable steepness, clinical look
 * Power:        Bias toward person or background
 *
 * ============================================================================
 * VISUAL COMPARISON
 * ============================================================================
 *
 * For t ∈ [0, 1], here's how each curve behaves at key points:
 *
 *           t=0.0  t=0.25  t=0.5  t=0.75  t=1.0
 * Linear:   0.00   0.25    0.50   0.75    1.00
 * Smooth:   0.00   0.16    0.50   0.84    1.00
 * Smoother: 0.00   0.10    0.50   0.90    1.00
 * Cosine:   0.00   0.15    0.50   0.85    1.00
 *
 * Notice how smoother curves compress the middle range,
 * making transitions faster but extremes more gradual.
 */

/**
 * Available blend curve types.
 */
export type BlendCurveType =
  | 'linear'
  | 'smoothstep'
  | 'smootherstep'
  | 'cosine'
  | 'sigmoid'
  | 'power2'
  | 'power3'
  | 'inversePower2'
  | 'inversePower3';

/**
 * Metadata for UI display.
 */
export interface BlendCurveInfo {
  id: BlendCurveType;
  name: string;
  description: string;
}

/**
 * Registry of blend curves for UI components.
 */
export const BLEND_CURVE_INFO: BlendCurveInfo[] = [
  {
    id: 'smoothstep',
    name: 'Smoothstep',
    description: 'Balanced S-curve (default)',
  },
  {
    id: 'smootherstep',
    name: 'Smootherstep',
    description: 'Extra smooth, flatter at edges',
  },
  {
    id: 'cosine',
    name: 'Cosine',
    description: 'Natural wave-like falloff',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Direct mapping, sharpest edges',
  },
  {
    id: 'sigmoid',
    name: 'Sigmoid',
    description: 'Steep center, gradual edges',
  },
  {
    id: 'power2',
    name: 'Ease In (Power 2)',
    description: 'Slow start, fast finish (favors background)',
  },
  {
    id: 'power3',
    name: 'Ease In (Power 3)',
    description: 'Very slow start, very fast finish',
  },
  {
    id: 'inversePower2',
    name: 'Ease Out (Power 2)',
    description: 'Fast start, slow finish (favors person)',
  },
  {
    id: 'inversePower3',
    name: 'Ease Out (Power 3)',
    description: 'Very fast start, very slow finish',
  },
];

/**
 * Clamp value to [0, 1] range.
 */
function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

/**
 * Linear interpolation (no curve).
 *
 * f(t) = t
 *
 * Characteristics:
 * - Constant rate of change
 * - Sharpest edges
 * - Fastest computation
 */
export function linear(t: number): number {
  return clamp01(t);
}

/**
 * Smoothstep curve (Hermite interpolation).
 *
 * f(t) = 3t² - 2t³
 *
 * Characteristics:
 * - First derivative is 0 at t=0 and t=1
 * - Creates smooth S-curve transition
 * - Good balance of smoothness and performance
 */
export function smoothstep(t: number): number {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

/**
 * Smootherstep curve (Ken Perlin's improved version).
 *
 * f(t) = 6t⁵ - 15t⁴ + 10t³
 *
 * Characteristics:
 * - First AND second derivatives are 0 at t=0 and t=1
 * - Even smoother than smoothstep
 * - Better for visible transitions
 */
export function smootherstep(t: number): number {
  t = clamp01(t);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Cosine interpolation.
 *
 * f(t) = (1 - cos(πt)) / 2
 *
 * Characteristics:
 * - Natural wave-like falloff
 * - Similar to smoothstep but slightly different curve
 * - Common in animation
 */
export function cosine(t: number): number {
  t = clamp01(t);
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * Sigmoid/logistic curve with fixed steepness.
 *
 * f(t) = 1 / (1 + e^(-k(t - 0.5)))
 *
 * Using k=12 for a nice steep transition.
 *
 * Characteristics:
 * - Very steep transition at center
 * - Very gradual at extremes
 * - Creates more defined person/background separation
 */
export function sigmoid(t: number): number {
  t = clamp01(t);
  const k = 12; // Steepness factor
  const raw = 1 / (1 + Math.exp(-k * (t - 0.5)));
  // Normalize to ensure f(0)=0 and f(1)=1
  const f0 = 1 / (1 + Math.exp(-k * (0 - 0.5)));
  const f1 = 1 / (1 + Math.exp(-k * (1 - 0.5)));
  return (raw - f0) / (f1 - f0);
}

/**
 * Power curve (ease in).
 *
 * f(t) = t^n
 *
 * Characteristics:
 * - Slow start, fast finish
 * - Biases toward showing more background at edges
 * - n=2 is quadratic, n=3 is cubic
 */
export function power2(t: number): number {
  t = clamp01(t);
  return t * t;
}

export function power3(t: number): number {
  t = clamp01(t);
  return t * t * t;
}

/**
 * Inverse power curve (ease out).
 *
 * f(t) = 1 - (1 - t)^n
 *
 * Characteristics:
 * - Fast start, slow finish
 * - Biases toward showing more person at edges
 * - Opposite of power curves
 */
export function inversePower2(t: number): number {
  t = clamp01(t);
  const inv = 1 - t;
  return 1 - inv * inv;
}

export function inversePower3(t: number): number {
  t = clamp01(t);
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

/**
 * Lookup table for blend curves.
 */
export const BLEND_CURVES: Record<BlendCurveType, (t: number) => number> = {
  linear,
  smoothstep,
  smootherstep,
  cosine,
  sigmoid,
  power2,
  power3,
  inversePower2,
  inversePower3,
};

/**
 * Apply a blend curve by name.
 *
 * @param t - Input value in [0, 1]
 * @param curveType - Which curve to apply
 * @returns Curved value in [0, 1]
 */
export function applyBlendCurve(t: number, curveType: BlendCurveType): number {
  const curveFn = BLEND_CURVES[curveType];
  return curveFn ? curveFn(t) : smoothstep(t); // Fallback to smoothstep
}

/**
 * Get the default/recommended blend curve.
 */
export function getDefaultBlendCurve(): BlendCurveType {
  return 'smootherstep';
}
