import React, { useState } from 'react';
import { Image } from 'expo-image';
import TwitterBanner from './TwitterBanner';

/**
 * Tente une URI distante ; en cas d'échec → bannière Twitter locale.
 */
export default function AppImage({ uri, variant = 'hero', style, height, contentFit = 'cover' }) {
  const [failed, setFailed] = useState(!uri);

  if (failed || !uri) {
    return <TwitterBanner variant={variant} style={style} height={height} />;
  }

  return (
    <Image
      source={{ uri }}
      style={[{ width: '100%', height: height || 120, borderRadius: 16 }, style]}
      contentFit={contentFit}
      onError={() => setFailed(true)}
      transition={200}
    />
  );
}
