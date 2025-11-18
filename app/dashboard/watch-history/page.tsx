import { Suspense } from "react";

import VideoPlayer from "@/app/ui/player/video-player";

export default async function Page() {
  return (
    <p className="flex h-screen w-full bg-gray-900 items-center justify-center text-white">
      您的观看历史记录将显示在这里
    </p>
  );
}
