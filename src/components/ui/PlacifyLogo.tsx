import React from 'react';
import { cn } from '@/lib/utils';

const LETTER_GRIDS: Record<string, number[][]> = {
    P: [
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
    ],
    L: [
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
    ],
    A: [
        [0, 1, 1, 1, 0],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
    ],
    C: [
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
    ],
    I: [
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
    ],
    F: [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
    ],
    Y: [
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
    ],
};

const LETTERS = ['P', 'L', 'A', 'C', 'I', 'F', 'Y'];

interface PlacifyLogoProps {
    collapsed?: boolean;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
}

export default function PlacifyLogo({
    collapsed = false,
    className,
    iconClassName,
    textClassName,
}: PlacifyLogoProps) {
    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            <style>{`
                .placify-logo-dot {
                    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), fill 0.25s ease, filter 0.25s ease;
                    transform-origin: var(--dot-origin);
                }
                .placify-logo-dot:hover {
                    transform: scale(1.6);
                    fill: #f87171 !important; /* red-400 */
                    filter: drop-shadow(0 0 3px #ef4444) drop-shadow(0 0 6px #b91c1c);
                }
                @keyframes laptop-code-pulse {
                    0%, 100% {
                        opacity: 0.95;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.4;
                        transform: scale(0.95);
                    }
                }
                .laptop-code-symbol {
                    transform-origin: 50px 61px;
                    animation: laptop-code-pulse 2.5s ease-in-out infinite;
                }
            `}</style>

            {/* Laptop Coder Icon */}
            <svg
                viewBox="0 0 100 100"
                className={cn(
                    "w-9 h-9 flex-shrink-0 transition-all duration-300",
                    "text-slate-800 dark:text-slate-100",
                    iconClassName
                )}
            >
                <defs>
                    {/* Mask to cut out the screen from the coder's torso/shoulders to create a transparent outline gap */}
                    <mask id="coder-torso-mask">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <rect x="10" y="40" width="80" height="42" fill="black" />
                    </mask>

                    {/* Mask to cut out the circle from the laptop screen */}
                    <mask id="laptop-screen-mask">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <circle cx="50" cy="61" r="14" fill="black" />
                    </mask>
                </defs>

                {/* Head */}
                <circle
                    cx="50"
                    cy="18"
                    r="16"
                    className="fill-current transition-colors duration-300"
                />

                {/* Torso with mask */}
                <path
                    d="M 20 62 C 20 34, 80 34, 80 62 Z"
                    mask="url(#coder-torso-mask)"
                    className="fill-current transition-colors duration-300"
                />

                {/* Laptop Screen with Circle Cutout Mask */}
                <rect
                    x="14"
                    y="44"
                    width="72"
                    height="34"
                    rx="4"
                    mask="url(#laptop-screen-mask)"
                    className="fill-current transition-colors duration-300"
                />

                {/* Keyboard Base Plate */}
                <rect
                    x="6"
                    y="82"
                    width="88"
                    height="6"
                    rx="3"
                    className="fill-current transition-colors duration-300"
                />

                {/* Laptop Stand Plate (Bottom feet) */}
                <rect
                    x="12"
                    y="90"
                    width="76"
                    height="6"
                    rx="3"
                    className="fill-current transition-colors duration-300"
                />

                {/* Inside Glowing Circle </> Code Symbol */}
                <g className="laptop-code-symbol">
                    <path
                        d="M 45 56.5 L 39 61.5 L 45 66.5 M 55 56.5 L 61 61.5 L 55 66.5 M 51.5 55.5 L 48.5 67.5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        style={{ fill: 'none' }}
                        className="fill-none transition-colors duration-300"
                    />
                </g>
            </svg>

            {/* Placify Dot-Matrix Typography */}
            {!collapsed && (
                <svg
                    viewBox="0 0 188 28"
                    className={cn(
                        "h-6 w-auto overflow-visible select-none filter drop-shadow-[0_0_2px_rgba(239,68,68,0.25)] dark:drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]",
                        textClassName
                    )}
                >
                    {LETTERS.map((letter, letterIndex) => {
                        const grid = LETTER_GRIDS[letter];
                        const letterX = letterIndex * 28; // letter width (20) + gap (8)

                        return (
                            <g key={`${letter}-${letterIndex}`}>
                                {grid.map((row, rowIndex) =>
                                    row.map((val, colIndex) => {
                                        if (val === 0) return null;

                                        const cx = letterX + colIndex * 4 + 2;
                                        const cy = rowIndex * 4 + 2;

                                        return (
                                            <circle
                                                key={`${rowIndex}-${colIndex}`}
                                                cx={cx}
                                                cy={cy}
                                                r={2.25}
                                                className="placify-logo-dot fill-red-600 dark:fill-red-500"
                                                style={{
                                                    '--dot-origin': `${cx}px ${cy}px`
                                                } as React.CSSProperties}
                                            />
                                        );
                                    })
                                )}
                            </g>
                        );
                    })}
                </svg>
            )}
        </div>
    );
}
