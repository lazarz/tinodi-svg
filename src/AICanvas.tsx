};

const [isPlaying, setIsPlaying] = useState(false);
const [volume, setVolume] = useState(1);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

const togglePlayPause = () => {
    if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }
};

const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
        audioRef.current.volume = newVolume;
    }
};

const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
        audioRef.current.currentTime = newTime;
    }
};

const handleLoadedMetadata = () => {
    if (audioRef.current) {
        setDuration(audioRef.current.duration);
    }
};

const handleTimeUpdateCustom = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    handleTimeUpdate(e);
    setCurrentTime(audioRef.current?.currentTime || 0);
};

const handlePauseEvent = () => {
    setIsPlaying(false);
};

const handlePlayEvent = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    handlePlay(e);
    setIsPlaying(true);
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

return (
    <div className="">
        <audio
            ref={audioRef}
            src={src}
            onTimeUpdate={handleTimeUpdateCustom}
            onPlay={handlePlayEvent}
            onPause={handlePauseEvent}
            onLoadedMetadata={handleLoadedMetadata}
            style={{ display: 'none' }}
        />

        {/* Custom Audio Controls */}
        <div style={{
            width: '1200px',
            padding: '20px',
            background: 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            {/* Play/Pause Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                    onClick={togglePlayPause}
                    style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#4CAF50',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Time Display */}
                <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '100px' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                {/* Seek Bar */}
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    style={{
                        flex: 1,
                        height: '6px',
                        cursor: 'pointer'
                    }}
                />

                {/* Volume Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={{
                            width: '100px',
                            height: '6px',
                            cursor: 'pointer'
                        }}
                    />
                    <span style={{ fontSize: '12px', minWidth: '35px' }}>
                            {Math.round(volume * 100)}%
                        </span>
                </div>
            </div>
        </div>

        <div className="mt-2 text-sm text-gray-500">
            Events registered: {events.length}
        </div>
