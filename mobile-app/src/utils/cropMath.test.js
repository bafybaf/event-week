const { containRect, cropFrameForAspect, clampCropOffset, displayCropToImage } = require('./cropMath');

describe('cropMath', () => {
  test('containRect keeps the full image inside the box', () => {
    const rect = containRect(2000, 1000, 400, 400);
    expect(rect.width).toBe(400);
    expect(rect.height).toBe(200);
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(100);
  });

  test('cropFrameForAspect builds the largest frame that fits', () => {
    expect(cropFrameForAspect(400, 200, 1)).toEqual({ width: 200, height: 200 });
    expect(cropFrameForAspect(400, 200, 16 / 9).width).toBeCloseTo(200 * (16 / 9));
  });

  test('clampCropOffset keeps the frame on the image', () => {
    const clamped = clampCropOffset(-50, 80, 100, 100, 0, 0, 400, 200);
    expect(clamped).toEqual({ x: 0, y: 80 });
  });

  test('displayCropToImage maps the visible crop back to pixels', () => {
    const crop = displayCropToImage({
      frameX: 100,
      frameY: 100,
      frameWidth: 200,
      frameHeight: 200,
      displayX: 0,
      displayY: 100,
      scale: 0.2,
      imageWidth: 2000,
      imageHeight: 1000
    });
    expect(crop).toEqual({ originX: 500, originY: 0, width: 1000, height: 1000 });
  });
});
