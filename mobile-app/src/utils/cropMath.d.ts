export function containRect(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number
): { x: number; y: number; width: number; height: number; scale: number };

export function cropFrameForAspect(
  displayWidth: number,
  displayHeight: number,
  aspect: number | null
): { width: number; height: number };

export function clampCropOffset(
  offsetX: number,
  offsetY: number,
  frameWidth: number,
  frameHeight: number,
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number
): { x: number; y: number };

export function displayCropToImage(params: {
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  displayX: number;
  displayY: number;
  scale: number;
  imageWidth: number;
  imageHeight: number;
}): { originX: number; originY: number; width: number; height: number };
