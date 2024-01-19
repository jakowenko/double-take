const { calculateOrientationCoefficient } = require('./compreface');

describe('calculateOrientationCoefficient', () => {
  test('returns 1 for zero pitch, roll, and yaw', () => {
    const coefficient = calculateOrientationCoefficient(0, 0, 0);
    expect(coefficient).toBe(1);
  });

  test('returns 0 for maximum pitch, roll, and yaw', () => {
    const coefficient = calculateOrientationCoefficient(10, 10, 10, 10, 10, 10);
    expect(coefficient).toBeCloseTo(0, 5);
  });

  test('returns correct value for positive inputs within the max range', () => {
    const pitch = 5, roll = 3, yaw = 2;
    const coefficient = calculateOrientationCoefficient(pitch, roll, yaw, 30, 30, 30);
    const expected = 1 - Math.sqrt(
      (pitch/30) * (pitch/30) +
      (roll/30) * (roll/30) +
      (yaw/30) * (yaw/30)
    );
    expect(coefficient).toBeCloseTo(expected);
  });

  test('returns correct value for negative inputs within the max range', () => {
    const pitch = -5, roll = -3, yaw = -2;
    const coefficient = calculateOrientationCoefficient(pitch, roll, yaw, 10, 10, 10);
    const expected = 1 - Math.sqrt(
      (pitch/10) * (pitch/10) +
      (roll/10) * (roll/10) +
      (yaw/10) * (yaw/10)
    );
    expect(coefficient).toBeCloseTo(expected);
  });

  test('caps the coefficient at 0 if the distance exceeds 1', () => {
    const coefficient = calculateOrientationCoefficient(20, 20, 20, 10, 10, 10);
    expect(coefficient).toBe(0);
  });

  test('allows custom max values for pitch, roll, and yaw', () => {
    const pitch = 15, roll = 15, yaw = 15;
    const maxPitch = 30, maxRoll = 30, maxYaw = 30;
    const coefficient = calculateOrientationCoefficient(
      pitch,
      roll,
      yaw,
      maxPitch,
      maxRoll,
      maxYaw
    );
    const expected = 1 - Math.sqrt(
      (pitch/maxPitch) * (pitch/maxPitch) +
      (roll/maxRoll) * (roll/maxRoll) +
      (yaw/maxYaw) * (yaw/maxYaw)
    );
    expect(coefficient).toBeCloseTo(expected);
  });

  // Additional tests could include:
  
  // Test that the function returns a coefficient between 0 and 1 for any input
  // Test what happens when max values are set to 0 (if this is a valid scenario)
  // Test with extreme values for pitch, roll, and yaw
  // Test the behavior when non-numeric values are passed as arguments
});