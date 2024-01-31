const math = require('mathjs');

const { calculateOrientationCoefficient, isFacingCamera } = require('./compreface');


describe('calculateOrientationCoefficient', () => {
  test('should correctly calculate pose direction for pitch=30, roll=45, yaw=60', () => {
    const pitch = 30;
    const roll = 45;
    const yaw = 60;
    const result = calculateOrientationCoefficient(pitch, roll, yaw);
    const expected = [0.7891491309924313, -0.04736717274537655, 0.6123724356957946];
    expect(result).toEqual(expect.arrayContaining(expected));
  });

  test('should correctly calculate pose direction for pitch=0, roll=0, yaw=0', () => {
    const pitch = 0;
    const roll = 0;
    const yaw = 0;
    const result = calculateOrientationCoefficient(pitch, roll, yaw);
    const expected = [0, 0, 1];
    expect(result).toEqual(expect.arrayContaining(expected));
  });

  test('should correctly calculate pose direction for pitch=90, roll=0, yaw=0', () => {
    const pitch = 90;
    const roll = 0;
    const yaw = 0;
    const result = calculateOrientationCoefficient(pitch, roll, yaw);
    const expected = [1, 0, 0];
    expect(result).toEqual(expect.arrayContaining(expected));
  });

  test('should correctly calculate pose direction for pitch=0, roll=90, yaw=0', () => {
    const pitch = 0;
    const roll = 90;
    const yaw = 0;
    const result = calculateOrientationCoefficient(pitch, roll, yaw);
    const expected = [0, 0, -1];
    expect(result).toEqual(expect.arrayContaining(expected));
  });

  test('should correctly calculate pose direction for pitch=0, roll=0, yaw=90', () => {
    const pitch = 0;
    const roll = 0;
    const yaw = 90;
    const result = calculateOrientationCoefficient(pitch, roll, yaw);
    const expected = [0, 1, 0];
    expect(result).toEqual(expect.arrayContaining(expected));
  });
});

describe('isFacingCamera', () => {
  it('should return false when the pose is directly facing the camera', () => {
    expect(isFacingCamera(0, 0, 0)).toBe(false);
  });

  it('should return true when the pose is facing away from the camera', () => {
    expect(isFacingCamera(0, 0, 180)).toBe(false);
  });

  it('should return false when the pose is upside down but facing towards the camera', () => {
    expect(isFacingCamera(-180, 0, 0)).toBe(true);
  });

  it('should return true when the pose is upside down and facing away from the camera', () => {
    expect(isFacingCamera(-180, 0, 180)).toBe(true);
  });

  it('should return false when the Z-component is not the dominant one (pitch)', () => {
    expect(isFacingCamera(90, 0, 0)).toBe(false);
  });

  it('should return false when the Z-component is not the dominant one (roll)', () => {
    expect(isFacingCamera(0, 90, 0)).toBe(false);
  });

  it('throws an error when inputs are not numbers', () => {
    expect(() => isFacingCamera('a', 'b', 'c')).toThrow(
      'Invalid input: pitch, roll, and yaw must be numbers'
    );
  });


  it('returns true when Z-component is negative and dominant', () => {
    calculateOrientationCoefficient(0, 0, -1);
    expect(isFacingCamera(0, 0, 0)).toBe(false);
  });

  it('returns false when Z-component is positive', () => {
    calculateOrientationCoefficient(0, 0, 1);
    expect(isFacingCamera(0, 0, 0)).toBe(false);
  });

  it('returns false when Z-component is negative but not dominant', () => {
    calculateOrientationCoefficient(1, 2, -0.5);
    expect(isFacingCamera(0, 0, 0)).toBe(false);
  });
});
