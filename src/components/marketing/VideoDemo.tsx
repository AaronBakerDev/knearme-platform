"use client";

import { useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Video Demo Section
 *
 * Shows the voice-to-portfolio workflow in action.
 * Critical for conversion - contractors need to SEE how easy it is.
 */

export function VideoDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section className="py-24 bg-zinc-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            See It In Action
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            From Job Site to Published in 2 Minutes
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Watch how contractors document their work without typing a single word.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative mx-auto max-w-4xl">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-800 ring-1 ring-white/10 shadow-2xl">
            {/* Placeholder - replace with actual video embed */}
            {!isPlaying ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                {/* Thumbnail mockup */}
                <div className="absolute inset-0 opacity-50">
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-blue-600/20" />
                </div>

                {/* Play button */}
                <button
                  onClick={() => setIsPlaying(true)}
                  className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white text-zinc-900 shadow-xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <Play className="h-8 w-8 ml-1" fill="currentColor" />
                </button>
                <p className="relative z-10 mt-6 text-sm text-zinc-400">
                  Watch the 90-second demo
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                {/* Placeholder for actual video */}
                <div className="text-center">
                  <div className="animate-pulse text-zinc-500 mb-4">
                    <div className="h-12 w-12 mx-auto rounded-full border-4 border-zinc-700 border-t-primary animate-spin" />
                  </div>
                  <p className="text-zinc-500 text-sm">Video coming soon</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-zinc-400 hover:text-white"
                    onClick={() => setIsPlaying(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Video controls hint */}
          {isPlaying && (
            <div className="absolute bottom-4 right-4 z-20">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>

        {/* Feature highlights below video */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto text-center">
          <div>
            <div className="text-2xl font-bold text-white">No Typing</div>
            <p className="text-sm text-zinc-400">Just talk naturally</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Phone or Tablet</div>
            <p className="text-sm text-zinc-400">Works from anywhere</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">Instant Publish</div>
            <p className="text-sm text-zinc-400">Live in seconds</p>
          </div>
        </div>
      </div>
    </section>
  );
}
