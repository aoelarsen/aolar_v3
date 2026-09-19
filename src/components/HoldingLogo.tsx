import { useEffect, useRef } from 'preact/hooks';

const MARK_CX = 100;
const MARK_CY = 108;

// The A's geometry (must match BRACE_PATH's straight segments below), used
// to find exactly where the chain/crossbar should meet each leg.
const APEX_X = 100;
const APEX_Y = 26;
const FOOT_Y = 150;
const LEFT_FOOT_X = 44;
const RIGHT_FOOT_X = 156;

function xOnLeg(footX: number, y: number) {
    const t = (y - APEX_Y) / (FOOT_Y - APEX_Y);
    return APEX_X + (footX - APEX_X) * t;
}

function polarPoint(cx: number, cy: number, angleDeg: number, r: number): [number, number] {
    const angle = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(angle), cy - r * Math.sin(angle)];
}

function pathFromPoints(points: Array<[number, number]>): string {
    const [first, ...rest] = points;
    const command = rest.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ');
    return `M ${first[0].toFixed(2)} ${first[1].toFixed(2)} L ${command} Z`;
}

/**
 * A circle as a two-arc path rather than a <circle> element: pathLength-based
 * dash hiding is reliably supported on <path> across browsers, but flaky on
 * basic shapes, so every drawable here is a path for consistent behavior.
 */
function buildCirclePath(cx: number, cy: number, r: number) {
    const left = cx - r;
    const right = cx + r;
    return `M ${right} ${cy} A ${r} ${r} 0 1 1 ${left} ${cy} A ${r} ${r} 0 1 1 ${right} ${cy}`;
}

/** A cog: a ring of flat-topped (trapezoidal) teeth, unlike a chainring's sharp ones. */
function buildGearPath(
    cx: number,
    cy: number,
    teeth: number,
    rootR: number,
    tipR: number,
    tipAngleDeg: number,
    rampAngleDeg: number,
) {
    const segmentAngle = 360 / teeth;
    const points: Array<[number, number]> = [];
    for (let i = 0; i < teeth; i++) {
        const segStart = i * segmentAngle;
        const rootLeft = segStart;
        const tipLeft = rootLeft + rampAngleDeg;
        const tipRight = tipLeft + tipAngleDeg;
        const rootRight = tipRight + rampAngleDeg;
        points.push(polarPoint(cx, cy, rootLeft, rootR));
        points.push(polarPoint(cx, cy, tipLeft, tipR));
        points.push(polarPoint(cx, cy, tipRight, tipR));
        points.push(polarPoint(cx, cy, rootRight, rootR));
    }
    return pathFromPoints(points);
}

/** One chain link: a horizontal stadium (capsule) outline. */
function buildStadiumPath(cx: number, cy: number, length: number, r: number) {
    const straightHalf = length / 2 - r;
    const left = (cx - straightHalf).toFixed(2);
    const right = (cx + straightHalf).toFixed(2);
    const top = (cy - r).toFixed(2);
    const bottom = (cy + r).toFixed(2);
    return `M ${left} ${top} L ${right} ${top} A ${r} ${r} 0 0 1 ${right} ${bottom} L ${left} ${bottom} A ${r} ${r} 0 0 1 ${left} ${top}`;
}

/**
 * A bicycle chain: a row of overlapping links, as one multi-subpath string
 * so it reveals link by link, left to right, under the same pathLength-based
 * dash animation as every other stroke here.
 */
function buildChainPath(y: number, xStart: number, xEnd: number, links: number, r: number, overlap: number) {
    const pitch = (xEnd - xStart) / links;
    const length = pitch + overlap;
    const subpaths: string[] = [];
    for (let i = 0; i < links; i++) {
        const cx = xStart + pitch * (i + 0.5);
        subpaths.push(buildStadiumPath(cx, y, length, r));
    }
    return subpaths.join(' ');
}

/** A short horizontal bar, centered at (cx, y). */
function buildHorizontalBarPath(cx: number, y: number, halfWidth: number) {
    return `M ${(cx - halfWidth).toFixed(2)} ${y} L ${(cx + halfWidth).toFixed(2)} ${y}`;
}

const COG_PATH = buildGearPath(MARK_CX, MARK_CY, 10, 26, 35, 16, 5);
const HUB_PATH = buildCirclePath(MARK_CX, MARK_CY, 17);

// Where the chain (standing in for the A's crossbar) meets each leg.
const CHAIN_LEFT_X = xOnLeg(LEFT_FOOT_X, MARK_CY);
const CHAIN_RIGHT_X = xOnLeg(RIGHT_FOOT_X, MARK_CY);

const CHAIN_PATH = buildChainPath(MARK_CY, CHAIN_LEFT_X, CHAIN_RIGHT_X, 6, 4, 3);

// Draws the "A" as one continuous stroke: bottom-left foot up to the apex,
// then down to the bottom-right foot, so the animation runs left-up-right.
const BRACE_PATH = `M ${LEFT_FOOT_X} ${FOOT_Y} L ${APEX_X} ${APEX_Y} L ${RIGHT_FOOT_X} ${FOOT_Y}`;

// The A's feet: a short horizontal bar centered on each leg's endpoint.
const FOOT_BAR_HALF_WIDTH = 8;
const FOOT_BAR_LEFT_PATH = buildHorizontalBarPath(LEFT_FOOT_X, FOOT_Y, FOOT_BAR_HALF_WIDTH);
const FOOT_BAR_RIGHT_PATH = buildHorizontalBarPath(RIGHT_FOOT_X, FOOT_Y, FOOT_BAR_HALF_WIDTH);

/**
 * Mark: an upward, forward-leaning "A" whose two feet are capped with a
 * short horizontal bar, with a cog (flat-topped teeth, plus an inner hub
 * circle) at its center and a bicycle chain standing in for its crossbar.
 *
 * Every stroke has pathLength=100, so the hidden-until-drawn state is a
 * plain CSS default (`.draw` in global.css) present from the very first
 * paint - it doesn't wait on this component's JS to load and hide it
 * after the fact, so there's no flash of the fully-drawn mark before the
 * animation starts. This component's only job is to reveal it by adding
 * `is-drawn`, and only when JS has run and the visitor allows motion; a
 * <noscript> rule and a prefers-reduced-motion rule in global.css cover
 * every other case by keeping it visible without any JS involved at all.
 */
export default function HoldingLogo() {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (prefersReducedMotion) return;

        svg.classList.add('is-drawn');
    }, []);

    return (
        <svg
            ref={svgRef}
            class='holding-logo'
            viewBox='0 0 200 200'
            role='img'
            aria-label='AOLar Holding'
            xmlns='http://www.w3.org/2000/svg'
        >
            <path class='draw logo-brace' pathLength={100} d={BRACE_PATH} />
            <path class='draw logo-foot-bar-left' pathLength={100} d={FOOT_BAR_LEFT_PATH} />
            <path class='draw logo-foot-bar-right' pathLength={100} d={FOOT_BAR_RIGHT_PATH} />
            <path class='draw logo-chain' pathLength={100} d={CHAIN_PATH} />
            <path class='draw logo-cog' pathLength={100} d={COG_PATH} />
            <path class='draw logo-hub' pathLength={100} d={HUB_PATH} />
        </svg>
    );
}
