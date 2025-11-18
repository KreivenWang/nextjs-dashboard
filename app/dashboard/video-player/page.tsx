'use client';

import React, { Suspense } from 'react';
import VideoPlayer from '@/app/ui/player/video-player';

export default function Page() {
  return (
    <div className="flex h-screen w-full bg-gray-900">
      <Suspense>
        <VideoPlayer />
      </Suspense>
    </div>
  );
}