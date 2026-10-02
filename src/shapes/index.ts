import { circle } from './circle';
import square from './square';
import { triangle } from './triangle';

// Export "area" as a composition of "circle", "square" and "triangle"
export const area = { circle, square, triangle };
