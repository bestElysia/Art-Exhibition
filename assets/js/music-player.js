document.addEventListener('DOMContentLoaded', () => {
    // === 1. 播放列表配置 ===
    const playlist = [
        {
            title: "Majo no Tabitabi Literature",
            artist: "yanxu player",
            src: "assets/music/Majo no Tabitabi OPLiterature Piano Cover.mp3",
            cover: "assets/music/Majo no Tabitabi.jpg"
        }
    ];

    // 智能路径修正 (防止在子文件夹找不到文件)
    const isInSubFolder = window.location.pathname.includes('/papers/') || window.location.pathname.includes('/essays/');
    playlist.forEach(track => {
        if (isInSubFolder && !track.src.startsWith('../') && !track.src.startsWith('http')) {
            track.src = '../' + track.src;
            track.cover = '../' + track.cover;
        }
    });

    let currentTrackIndex = 0;
    let isPlaying = false;
    
    // 创建音频对象
    const audio = new Audio();
    audio.preload = "auto";
    // 确保列表不为空才加载
    if (playlist.length > 0) {
        audio.src = playlist[0].src;
    }

    const musicBtn = document.getElementById('music-toggle');
    
    // === 2. 核心功能函数 ===

    // 【新增】向系统汇报当前的播放进度、总时长
    function updatePositionState() {
        if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
            // 只有当获取到有效的时长时才设置，否则进度条会失效
            if (!isNaN(audio.duration) && isFinite(audio.duration)) {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate,
                    position: audio.currentTime
                });
            }
        }
    }

    // 更新系统锁屏中心的媒体信息
    function updateMediaSession() {
        if ('mediaSession' in navigator) {
            const track = playlist[currentTrackIndex];
            
            // 1. 设置元数据 (封面、标题、歌手)
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist, 
                album: "晨光画境", 
                artwork: [
                    { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
                ]
            });

            // 2. 绑定动作
            const actionHandlers = [
                ['play', () => playMusic()],
                ['pause', () => pauseMusic()],
                ['previoustrack', () => playNext()], 
                ['nexttrack', () => playNext()],
                // 【关键修复】允许锁屏拖动进度条
                ['seekto', (details) => {
                    if (details.fastSeek && 'fastSeek' in audio) {
                        audio.fastSeek(details.seekTime);
                    } else {
                        audio.currentTime = details.seekTime;
                    }
                    // 拖动后立即更新系统状态
                    updatePositionState();
                }]
            ];

            for (const [action, handler] of actionHandlers) {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch (error) {
                    // 忽略不支持的 action
                }
            }
        }
    }

    // 切换播放/暂停
    function toggleMusic() {
        if (audio.paused) {
            playMusic();
        } else {
            pauseMusic();
        }
    }

    // 播放逻辑
    function playMusic() {
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updateUI(true);
                updateMediaSession(); // 更新元数据
                updatePositionState(); // 更新进度条
            }).catch(error => {
                console.log("自动播放被阻止:", error);
                isPlaying = false;
                updateUI(false);
            });
        }
    }

    // 暂停逻辑
    function pauseMusic() {
        audio.pause();
        isPlaying = false;
        updateUI(false);
        // 暂停时也更新一下状态
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = "paused";
        }
    }

    // 切换到下一首 (如果只有一首，则是单曲循环)
    function playNext() {
        currentTrackIndex++;
        if (currentTrackIndex >= playlist.length) {
            currentTrackIndex = 0;
        }
        
        audio.src = playlist[currentTrackIndex].src;
        playMusic();
    }

    // 更新 UI 状态
    function updateUI(playing) {
        if (musicBtn) {
            if (playing) {
                musicBtn.classList.remove('muted');
                musicBtn.classList.add('playing');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
            } else {
                musicBtn.classList.add('muted');
                musicBtn.classList.remove('playing');
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
            }
        }
    }

    // === 3. 事件监听 ===

    if (musicBtn) {
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });
    }

    // 自动播放下一首
    audio.addEventListener('ended', () => {
        playNext();
    });

    // 【关键】监听音频加载和时间更新，同步给系统锁屏
    // 当音频元数据加载完毕（知道时长了），立即更新进度条上限
    audio.addEventListener('loadedmetadata', updatePositionState);
    
    // 当播放速率改变或播放/暂停时，更新状态
    audio.addEventListener('ratechange', updatePositionState);
    audio.addEventListener('play', updatePositionState);
    audio.addEventListener('pause', updatePositionState);

    // 暴露给全局
    window.musicPlayer = {
        play: playMusic,
        pause: pauseMusic,
        next: playNext
    };
});
