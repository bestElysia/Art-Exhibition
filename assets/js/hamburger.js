document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sideNav = document.getElementById('sideNav');
    const navLinks = document.querySelectorAll('.nav-item');
    const langSwitch = document.getElementById('nav-lang-switch');

    let isOpen = false;

    // 切换菜单状态
    function toggleMenu() {
        isOpen = !isOpen;
        hamburger.classList.toggle('active', isOpen);
        sideNav.classList.toggle('open', isOpen);
    }

    // 关闭菜单
    function closeMenu() {
        isOpen = false;
        hamburger.classList.remove('active');
        sideNav.classList.remove('open');
    }

    // 点击汉堡按钮
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // 点击页面其他区域关闭菜单
    document.addEventListener('click', (e) => {
        if (isOpen && !sideNav.contains(e.target) && !hamburger.contains(e.target)) {
            closeMenu();
        }
    });

    // 点击链接后自动关闭
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // 如果不是语言切换按钮，则关闭
            if (!link.classList.contains('lang-switch')) {
                closeMenu();
            }
        });
    });

    // 联动主页面的语言切换
    if (langSwitch) {
        langSwitch.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 调用主页面定义的 toggleLanguage 函数 (如果存在)
            if (typeof window.toggleLanguage === 'function') {
                window.toggleLanguage();
            }

            // 更新菜单内的文字显示
            const textSpan = langSwitch.querySelector('span');
            if (textSpan) {
                // 简单的逻辑判断，实际应与主页面 currentLang 同步
                textSpan.innerText = textSpan.innerText === 'EN' ? '中文' : 'EN';
            }
        });
    }

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeMenu();
        }
    });
});

