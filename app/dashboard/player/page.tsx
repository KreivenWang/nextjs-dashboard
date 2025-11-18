'use client';

import React from 'react';
import VideoPlayer from '@/app/ui/player/video-player';

export default function PlayerPage() {
  return (
    <div className="flex h-screen w-full bg-gray-900">
      <VideoPlayer />
    </div>
  );
}