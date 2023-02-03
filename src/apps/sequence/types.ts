
export type SimplifiedFacingMode = "user" | "environment";

export function string_to_simplified_facing_mode(str: string): SimplifiedFacingMode {
    if (str === "user") { return "user"; }
    if (str === "environment") { return "environment"; }
    return "user";
}

export function facing_mode_to_simplified(facingMode: VideoFacingModeEnum): SimplifiedFacingMode {
    if (facingMode === "user") { return "user"; }
    if (facingMode === "environment") { return "environment"; }
    return "user";
}

export function simplified_facing_mode_to_facing_mode(simplifiedFacingMode: SimplifiedFacingMode): VideoFacingModeEnum {
    return simplifiedFacingMode;
}

export type ModelComplexity = 0 | 1 | 2;

export function number_to_model_complexity(num: number): ModelComplexity {
    if (num === 0) { return 0; }
    if (num === 1) { return 1; }
    if (num === 2) { return 2; }
    return 0;
}