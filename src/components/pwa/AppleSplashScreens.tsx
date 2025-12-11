/**
 * Apple Splash Screen (Launch Image) Meta Tags.
 *
 * iOS PWAs require specific splash screen images for each device resolution.
 * These are defined via <link rel="apple-touch-startup-image"> tags with media queries.
 *
 * Generated using: npx pwa-asset-generator public/icons/icon-512.svg public/icons/splash --splash-only --portrait-only
 *
 * @see https://developer.apple.com/design/human-interface-guidelines/layout/
 * @see https://appsco.pe/developer/splash-screens
 */

/**
 * Splash screen definitions with device-specific media queries.
 * Each entry maps to a specific iOS device resolution.
 */
const splashScreens = [
  // iPad Pro 12.9" (2048x2732 @ 2x)
  { width: 2048, height: 2732, deviceWidth: 1024, deviceHeight: 1366, ratio: 2 },
  // iPad Pro 11" (1668x2388 @ 2x)
  { width: 1668, height: 2388, deviceWidth: 834, deviceHeight: 1194, ratio: 2 },
  // iPad 10.2" (1536x2048 @ 2x)
  { width: 1536, height: 2048, deviceWidth: 768, deviceHeight: 1024, ratio: 2 },
  // iPad Air 10.9" (1640x2360 @ 2x)
  { width: 1640, height: 2360, deviceWidth: 820, deviceHeight: 1180, ratio: 2 },
  // iPad Pro 10.5" (1668x2224 @ 2x)
  { width: 1668, height: 2224, deviceWidth: 834, deviceHeight: 1112, ratio: 2 },
  // iPad 10.2" (1620x2160 @ 2x)
  { width: 1620, height: 2160, deviceWidth: 810, deviceHeight: 1080, ratio: 2 },
  // iPad Mini (1488x2266 @ 2x)
  { width: 1488, height: 2266, deviceWidth: 744, deviceHeight: 1133, ratio: 2 },
  // iPhone 16 Pro Max (1320x2868 @ 3x)
  { width: 1320, height: 2868, deviceWidth: 440, deviceHeight: 956, ratio: 3 },
  // iPhone 16 (1206x2622 @ 3x)
  { width: 1206, height: 2622, deviceWidth: 402, deviceHeight: 874, ratio: 3 },
  // iPhone 15 Pro Max (1260x2736 @ 3x)
  { width: 1260, height: 2736, deviceWidth: 420, deviceHeight: 912, ratio: 3 },
  // iPhone 15 Pro (1290x2796 @ 3x)
  { width: 1290, height: 2796, deviceWidth: 430, deviceHeight: 932, ratio: 3 },
  // iPhone 15 (1179x2556 @ 3x)
  { width: 1179, height: 2556, deviceWidth: 393, deviceHeight: 852, ratio: 3 },
  // iPhone 14 Pro (1170x2532 @ 3x)
  { width: 1170, height: 2532, deviceWidth: 390, deviceHeight: 844, ratio: 3 },
  // iPhone 14 Plus (1284x2778 @ 3x)
  { width: 1284, height: 2778, deviceWidth: 428, deviceHeight: 926, ratio: 3 },
  // iPhone X/Xs/11 Pro (1125x2436 @ 3x)
  { width: 1125, height: 2436, deviceWidth: 375, deviceHeight: 812, ratio: 3 },
  // iPhone Xs Max/11 Pro Max (1242x2688 @ 3x)
  { width: 1242, height: 2688, deviceWidth: 414, deviceHeight: 896, ratio: 3 },
  // iPhone Xr/11 (828x1792 @ 2x)
  { width: 828, height: 1792, deviceWidth: 414, deviceHeight: 896, ratio: 2 },
  // iPhone 8 Plus (1242x2208 @ 3x)
  { width: 1242, height: 2208, deviceWidth: 414, deviceHeight: 736, ratio: 3 },
  // iPhone 8/SE (750x1334 @ 2x)
  { width: 750, height: 1334, deviceWidth: 375, deviceHeight: 667, ratio: 2 },
  // iPhone SE (1st gen) (640x1136 @ 2x)
  { width: 640, height: 1136, deviceWidth: 320, deviceHeight: 568, ratio: 2 },
] as const;

/**
 * Renders Apple splash screen link tags in the document head.
 * Must be placed inside <head> element (use in layout.tsx).
 */
export function AppleSplashScreens() {
  return (
    <>
      {splashScreens.map(({ width, height, deviceWidth, deviceHeight, ratio }) => (
        <link
          key={`splash-${width}-${height}`}
          rel="apple-touch-startup-image"
          href={`/icons/splash/apple-splash-${width}-${height}.png`}
          media={`(device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`}
        />
      ))}
    </>
  );
}
