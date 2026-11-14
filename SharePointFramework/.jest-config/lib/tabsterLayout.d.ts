/**
 * Types for `pp365-jest-config/lib/tabsterLayout`, so the solutions' tests compile without a
 * declaration of their own.
 */

/**
 * Lays the page out for Tabster, which jsdom does not: every element offset by its parent, and
 * each cell of a grid in a box by its row and column, so Tab and the arrow keys move as in a
 * browser. Returns a function that puts jsdom back.
 */
export declare function layOutForTabster(): () => void
