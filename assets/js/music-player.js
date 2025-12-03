document.addEventListener('DOMContentLoaded', () => {
    // === 1. 播放列表配置 ===
    const playlist = [
        
        {
            title: "Majo no Tabitabi Literature",
            artist: "yanxu player",  // 【修改点】统一歌手名
            src: "assets/music/Majo no Tabitabi OPLiterature Piano Cover.mp3",
            cover: "assets/music/Majo no Tabitabi.jpg"
        }
    ];

    let currentTrackIndex = 0;
    let isPlaying = false;
    
    // 创建音频对象
    const audio = new Audio();
    audio.preload = "auto";
    // 初始化第一首
    audio.src = playlist[0].src;

    // 获取DOM元素
    const musicBtn = document.getElementById('music-toggle');
    
    // === 2. 核心功能函数 ===

    // 更新系统锁屏中心的媒体信息 (显示封面和歌手)
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

            // 2. 绑定锁屏控制事件
            navigator.mediaSession.setActionHandler('play', () => playMusic());
            navigator.mediaSession.setActionHandler('pause', () => pauseMusic());
            navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
            navigator.mediaSession.setActionHandler('previoustrack', () => playNext());
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
                // 播放成功后更新锁屏信息
                updateMediaSession();
            }).catch(error => {
                console.log("自动播放被阻止，等待用户交互:", error);
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
    }

    // 切换到下一首
    function playNext() {
        currentTrackIndex++;
        // 循环播放
        if (currentTrackIndex >= playlist.length) {
            currentTrackIndex = 0;
        }
        
        // 切换源
        audio.src = playlist[currentTrackIndex].src;
        
        // 播放 (会触发 updateMediaSession)
        playMusic();
        console.log("Now Playing:", playlist[currentTrackIndex].title);
    }

    // 更新 UI 状态
    function updateUI(playing) {
        if (musicBtn) {
            if (playing) {
                musicBtn.classList.remove('muted');
                musicBtn.classList.add('playing');
            } else {
                musicBtn.classList.add('muted');
                musicBtn.classList.remove('playing');
            }
        }
    }

    // === 3. 事件监听 ===

    // 按钮点击事件
    if (musicBtn) {
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止冒泡
            toggleMusic();
        });
    }

    // 监听歌曲结束事件 -> 自动播放下一首
    audio.addEventListener('ended', () => {
        playNext();
    });

    // 暴露给全局
    window.musicPlayer = {
        play: playMusic,
        pause: pauseMusic,
        next: playNext
    };
});
