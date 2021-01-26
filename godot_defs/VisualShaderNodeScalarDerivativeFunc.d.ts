
/**
 * This node is only available in `Fragment` and `Light` visual shaders.
 *
*/
declare class VisualShaderNodeScalarDerivativeFunc extends VisualShaderNode {

  
/**
 * This node is only available in `Fragment` and `Light` visual shaders.
 *
*/
  "new"(): VisualShaderNodeScalarDerivativeFunc;
  static "new"(): VisualShaderNodeScalarDerivativeFunc;



/** The derivative type. See [enum Function] for options. */
function: int;



  connect<T extends SignalsOf<VisualShaderNodeScalarDerivativeFunc>, U extends Node>(signal: T, node: U, method: keyof U): number;



/**
 * Sum of absolute derivative in `x` and `y`.
 *
*/
static FUNC_SUM: 0;

/**
 * Derivative in `x` using local differencing.
 *
*/
static FUNC_X: 1;

/**
 * Derivative in `y` using local differencing.
 *
*/
static FUNC_Y: 2;


  
}