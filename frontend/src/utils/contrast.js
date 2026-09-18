export function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((channel) => channel + channel)
          .join("")
      : clean;

  const numeric = parseInt(value, 16);

  return {
    r: (numeric >> 16) & 0xff,
    g: (numeric >> 8) & 0xff,
    b: numeric & 0xff,
  };
}

export function rgbToHex({ r, g, b }) {
  const channel = (value) => value.toString(16).padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);

  const channel = (value) => {
    const linear = value / 255;
    return linear <= 0.04045
      ? linear / 12.92
      : ((linear + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  );
}

export function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);

  const [lighter, darker] = [
    foregroundLuminance,
    backgroundLuminance,
  ].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

export function blendOver(foreground, background, alpha) {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  const mix = (foregroundChannel, backgroundChannel) =>
    Math.round(
      alpha * foregroundChannel + (1 - alpha) * backgroundChannel,
    );

  return rgbToHex({
    r: mix(fg.r, bg.r),
    g: mix(fg.g, bg.g),
    b: mix(fg.b, bg.b),
  });
}