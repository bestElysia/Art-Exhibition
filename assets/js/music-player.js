document.addEventListener('DOMContentLoaded', () => {
    // === 1. 播放列表配置 ===
    const playlist = [
        
        {
            title: "Majo no Tabitabi Literature",
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
        // play() 返回一个 Promise，处理自动播放策略限制
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                updateUI(true);
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
        // 如果是最后一首，回到第一首 (循环播放)
        if (currentTrackIndex >= playlist.length) {
            currentTrackIndex = 0;
        }
        
        // 切换源并播放
        audio.src = playlist[currentTrackIndex].src;
        playMusic();
        console.log("Now Playing:", playlist[currentTrackIndex].title);
    }

    // 更新 UI 状态
    function updateUI(playing) {
        if (playing) {
            musicBtn.classList.remove('muted');
            musicBtn.classList.add('playing');
        } else {
            musicBtn.classList.add('muted');
            musicBtn.classList.remove('playing');
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

    // (可选) 暴露给全局，方便调试
    window.musicPlayer = {
        play: playMusic,
        pause: pauseMusic,
        next: playNext
    };
});
