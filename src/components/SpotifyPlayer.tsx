import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface Track {
  title: string;
  artist: string;
  duration: number; // in seconds
}

const MOCK_TRACKS: Track[] = [
  { title: "Lofi Beats - Focus", artist: "ChillHop", duration: 180 },
  { title: "Import Flow", artist: "Study Zone", duration: 210 },
  { title: "Productivity Mix", artist: "WorkBeats", duration: 195 },
  { title: "Calm Vibes", artist: "Ambient Pro", duration: 225 },
];

const SpotifyPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = MOCK_TRACKS[currentTrackIndex];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % MOCK_TRACKS.length);
    setProgress(0);
  };

  const handlePrevious = () => {
    if (progress > 3) {
      setProgress(0);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + MOCK_TRACKS.length) % MOCK_TRACKS.length);
      setProgress(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (progress / currentTrack.duration) * 100;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-10 bg-card border border-border rounded-full p-2 shadow-medium flex items-center gap-2">
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
          <span className="text-xs">🎵</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlayPause}
          className="h-8 w-8 rounded-full"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(false)}
          className="h-8 w-8 rounded-full"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t border-border shadow-strong">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-1/4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎵</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={handlePlayPause}
                className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(progress)}
              </span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-200"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>

          {/* Volume & Minimize */}
          <div className="flex items-center gap-3 w-1/4 justify-end">
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={(value) => {
                    setVolume(value[0]);
                    setIsMuted(value[0] === 0);
                  }}
                  className="cursor-pointer"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
