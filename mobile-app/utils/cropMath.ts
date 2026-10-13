export function containRect(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number
) {
  if (!imageWidth || !imageHeight || !boxWidth || !boxHeight) {
    return { x: 0, y: 0, width: 0, height: 0, scale: 0 };
  }
  const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: (boxWidth - width) / 2,
    y: (boxHeight - height) / 2,
    width,
    height,
    scale,
  };
}

export function cropFrameForAspect(
  displayWidth: number,
  displayHeight: number,
  aspect: number | null
) {
  if (!displayWidth || !displayHeight) {
    return { width: 0, height: 0 };
  }
  if (!aspect) {
    return { width: displayWidth, height: displayHeight };
  }
  let width = displayWidth;
  let height = width / aspect;
  if (height > displayHeight) {
    height = displayHeight;
    width = height * aspect;
  }
  return { width, height };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampCropOffset(
  offsetX: number,
  offsetY: number,
  frameWidth: number,
  frameHeight: number,
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number
) {
  return {
    x: clamp(offsetX, displayX, displayX + displayWidth - frameWidth),
    y: clamp(offsetY, displayY, displayY + displayHeight - frameHeight),
  };
}

export function displayCropToImage({
  frameX,
  frameY,
  frameWidth,
  frameHeight,
  displayX,
  displayY,
  scale,
  imageWidth,
  imageHeight,
}: {
  frameX: number;
  frameY: number;
  frameWidth: number;
  frameHeight: number;
  displayX: number;
  displayY: number;
  scale: number;
  imageWidth: number;
  imageHeight: number;
}) {
  if (!scale) {
    return { originX: 0, originY: 0, width: imageWidth || 0, height: imageHeight || 0 };
  }
  const originX = clamp(Math.round((frameX - displayX) / scale), 0, imageWidth);
  const originY = clamp(Math.round((frameY - displayY) / scale), 0, imageHeight);
  const width = clamp(Math.round(frameWidth / scale), 1, imageWidth - originX);
  const height = clamp(Math.round(frameHeight / scale), 1, imageHeight - originY);
  return { originX, originY, width, height };
}
