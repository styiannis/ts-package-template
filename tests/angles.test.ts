import { toDegrees, toRadians, toTurns } from '../src';

describe('Angles', () => {
  it('Degrees', () => {
    expect(toDegrees(Math.PI)).toBeCloseTo(180);
  });

  it('Radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI);
  });

  it('Turns', () => {
    expect(toTurns(90)).toBe(0.25);
  });
});
