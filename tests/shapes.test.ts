import { area } from '../src';

describe('Shapes', () => {
  it('Circle', () => {
    expect(area.circle(1)).toBeCloseTo(Math.PI);
  });

  it('Square', () => {
    expect(area.square(3)).toBe(9);
  });

  it('Triangle', () => {
    expect(area.triangle(4, 3)).toBe(6);
  });
});
