import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaDownload, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const FairytalePlayer = ({ audioUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);
  const previousVolumeRef = useRef(volume);
  
  // Format time (seconds) to MM:SS
  const formatTime = (time) => {
    if (isNaN(time) || time === Infinity) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };
  
  // Update progress bar as audio plays
  useEffect(() => {
    const audio = audioRef.current;
    
    // Handler functions
    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = (e) => {
      console.error('Błąd odtwarzania audio:', e);
      setPlayerError('Wystąpił problem z odtwarzaniem. Spróbuj pobrać plik audio.');
      setIsLoading(false);
    };
    
    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };
    
    // Add event listeners
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    
    // Set initial values
    audio.volume = volume;
    
    // Start loading
    audio.load();
    
    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      
      // Stop audio when component unmounts
      if (!audio.paused) {
        audio.pause();
      }
    };
  }, [audioUrl, volume]);
  
  // Play/pause audio
  const togglePlay = () => {
    if (playerError) {
      // Zresetuj błąd i spróbuj ponownie
      setPlayerError('');
      audioRef.current.load();
      return;
    }
    
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
    } else {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(_ => {
            // Autoplay started successfully
          })
          .catch(err => {
            console.error('Autoplay prevented:', err);
            setPlayerError('Nie można automatycznie odtworzyć audio. Kliknij ponownie aby spróbować.');
          });
      }
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle progress bar change
  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    const newTime = parseFloat(e.target.value);
    
    // Check if the value is valid
    if (!isNaN(newTime) && isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    // If we're adjusting volume while muted, unmute
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    
    if (isMuted) {
      // Unmute
      audio.volume = previousVolumeRef.current;
      setVolume(previousVolumeRef.current);
    } else {
      // Mute
      previousVolumeRef.current = volume;
      audio.volume = 0;
      setVolume(0);
    }
    
    setIsMuted(!isMuted);
  };
  
  // Full audio URL including backend base
  const fullAudioUrl = `http://localhost:5000${audioUrl}`;
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-medium mb-3">{title || 'Bajka'}</h3>
      
      <audio 
        ref={audioRef} 
        src={fullAudioUrl} 
        preload="metadata" 
      />
      
      {playerError ? (
        <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">
          {playerError}
          <button 
            onClick={() => {
              setPlayerError('');
              audioRef.current.load();
            }}
            className="ml-2 underline"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : null}
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors
            ${isLoading ? 'bg-gray-400 cursor-wait' : 'bg-primary hover:bg-primary-dark'}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        
        <div className="flex-1">
          <input
            type="range"
            value={currentTime}
            min="0"
            max={duration || 0}
            step="0.1"
            onChange={handleProgressChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isLoading || playerError}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="text-gray-600 hover:text-primary"
            title={isMuted ? "Włącz dźwięk" : "Wycisz"}
          >
            {isMuted || volume === 0 ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
          </button>
          
          <div className="w-16 hidden sm:block">
            <input
              type="range"
              value={volume}
              min="0"
              max="1"
              step="0.05"
              onChange={handleVolumeChange}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <a 
          href={fullAudioUrl} 
          download 
          className="text-primary hover:text-primary-dark"
          title="Pobierz"
        >
          <FaDownload size={18} />
        </a>
      </div>
      
      {isPlaying && (
        <div className="mt-2 flex justify-center">
          <div className="flex space-x-1">
            <span className="w-1 h-3 bg-primary rounded-full animate-pulse"></span>
            <span className="w-1 h-5 bg-primary rounded-full animate-pulse delay-75"></span>
            <span className="w-1 h-3 bg-primary rounded-full animate-pulse delay-150"></span>
            <span className="w-1 h-6 bg-primary rounded-full animate-pulse delay-300"></span>
            <span className="w-1 h-2 bg-primary rounded-full animate-pulse delay-150"></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FairytalePlayer;