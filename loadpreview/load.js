// 游戏状态管理器
class GameStatusManager {
    constructor() {
        this.gameTime = 0; // 秒数
        this.gameScore = 0;
        this.gameLevel = 1;
        this.startTime = Date.now();
        this.setupMessageListener();
        this.updateDisplays();
    }

    setupMessageListener() {
        // 监听来自游戏iframe的postMessage
        window.addEventListener('message', (event) => {
            try {
                const data = event.data;
                if (!data || typeof data !== 'object') return;

                // 处理新的统一消息格式
                if (data.type === 'ovomessage' && Array.isArray(data.data)) {
                    this.handleOvoMessage(data.data);
                }
                else if (data.type === 'adsdkmessage' && Array.isArray(data.data)) {
                    this.handleOvoMessage(data.data);
                }
            } catch (error) {
                console.warn('处理游戏状态消息失败:', error);
            }
        });

        console.log('[GameStatus] 消息监听器已设置');
    }

    /**
     * 处理新的ovomessage格式消息
     * @param {Array} messageArray - 包含多个事件的数组
     */
    handleOvoMessage(messageArray) {
        console.log('[GameStatus] 收到ovomessage，包含', messageArray.length, '个事件');

        messageArray.forEach(message => {
            try {
                switch (message.type) {
                    case 'GAME_TIME':
                        this.updateTime(message.value);
                        break;
                    case 'GAME_SCORE':
                        this.updateScore(message.value);
                        break;
                    case 'GAME_LEVEL':
                        this.updateLevel(message.value);
                        break;
                    case 'GAME_STATUS':
                        // 处理完整状态更新
                        if (message.value && typeof message.value === 'object') {
                            if (message.value.time !== undefined) this.updateTime(message.value.time);
                            if (message.value.score !== undefined) this.updateScore(message.value.score);
                            if (message.value.level !== undefined) this.updateLevel(message.value.level);
                        }
                        break;
                    default:
                        console.log('[GameStatus] 未知消息类型:', message.type);
                }
            } catch (error) {
                console.warn('[GameStatus] 处理消息失败:', message, error);
            }
        });
    }

    handleStatusUpdate(data) {
        if (data.time !== undefined) this.updateTime(data.time);
        if (data.score !== undefined) this.updateScore(data.score);
        if (data.level !== undefined) this.updateLevel(data.level);
    }

    handleTimeUpdate(data) {
        const time = data.time || data.seconds || data.value;
        if (time !== undefined) {
            this.updateTime(time);
        }
    }

    updateTime(seconds) {
        this.gameTime = seconds;
        this.updateTimeDisplay();
        console.log('[GameStatus] 时长更新:', this.formatTime(seconds));
    }

    updateScore(score) {
        if (score !== undefined && score !== null) {
            this.gameScore = score;
            this.updateScoreDisplay();
            console.log('[GameStatus] 分数更新:', score);
        }
    }

    updateLevel(level) {
        if (level !== undefined && level !== null) {
            this.gameLevel = level;
            this.updateLevelDisplay();
            console.log('[GameStatus] 关卡更新:', level);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateTimeDisplay() {
        const element = document.getElementById('game-time-display');
        if (element) {
            element.textContent = this.formatTime(this.gameTime);
            this.animateUpdate(element);
        }
    }

    updateScoreDisplay() {
        const element = document.getElementById('game-score-display');
        if (element) {
            element.textContent = this.gameScore.toLocaleString();
            this.animateUpdate(element);
        }
    }

    updateLevelDisplay() {
        const element = document.getElementById('game-level-display');
        if (element) {
            element.textContent = this.gameLevel;
            this.animateUpdate(element);
        }
    }

    animateUpdate(element) {
        element.classList.add('updated');
        setTimeout(() => {
            element.classList.remove('updated');
        }, 300);
    }

    updateDisplays() {
        this.updateTimeDisplay();
        this.updateScoreDisplay();
        this.updateLevelDisplay();
    }

    reset() {
        this.gameTime = 0;
        this.gameScore = 0;
        this.gameLevel = 1;
        this.startTime = Date.now();
        this.updateDisplays();
        console.log('[GameStatus] 状态已重置');
    }
}

class PreviewLoader {
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.type = this.urlParams.get('type');
        this.platformId = this.urlParams.get('platformId');
        this.gameId = this.urlParams.get('gameId');
        this.instanceId = this.urlParams.get('instanceId');

        // 初始化游戏状态管理器
        this.gameStatusManager = null;

        this.init();
    }

    async init() {


    }

    async loadPreview() {
        if (this.type === 'sdk') {
            await this.loadSDKPreview();
        } else if (this.type === 'game') {
            await this.loadGamePreview();
        } else {
            throw new Error('无效的预览类型');
        }
    }

    async loadSDKPreview() {
   
    }

    async loadGamePreview() {
        document.getElementById('page-title').textContent = '游戏预览';


    }




    renderGamePreview(backendUrl = null) {
      
        const basePreviewUrl = backendUrl || `/static/${this.platformId}/${env}/${this.gameId}/`;
        const iframe = document.getElementById('game-preview');


        // 确保iframe样式为占满容器
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.display = 'block';
        iframe.src = finalUrl;

        // 在 iframe load 后尝试在同源情况下注入或守护 SetInitialLoadFinished 函数，防止被覆盖或缺失
        try {
            iframe.addEventListener('load', () => {
                try {
                    const win = iframe.contentWindow;
                    if (!win) return;
                    // 仅在同源时操作，否则会抛出安全错误
                    try {
                        // 如果没有定义，则注入一个安全的实现
                        if (typeof win.SetInitialLoadFinished === 'undefined') {
                            win.SetInitialLoadFinished = function () {
                                try { this._hasFinishedInitialLoad = true; } catch (e) { }
                                try { if (typeof win.wop !== 'undefined' && win.wop !== null) { win.wop.trigger('loading.auto', { isAuto: false }); } } catch (err) { }
                            };
                            console.log('[Preview] 已注入 SetInitialLoadFinished 到 iframe');
                        }
                    } catch (crossErr) {
                        // 访问contentWindow的属性可能因跨域而失败，忽略
                    }

                    // 通知页面状态管理器游戏已加载
                    if (this.gameStatusManager) {
                        this.gameStatusManager.reset();
                        console.log('[Preview] 游戏状态已重置');
                    }
                } catch (innerErr) {
                    console.warn('[Preview] iframe load 处理失败:', innerErr && innerErr.message);
                }
            });
        } catch (e) {
            console.warn('[Preview] 无法附加 iframe load 监听器:', e && e.message);
        }

        // 初始化游戏状态管理器
        if (this.type === 'game' && !this.gameStatusManager) {
            this.gameStatusManager = new GameStatusManager();
            // 将管理器挂载到全局，以便HTML中的函数可以访问
            window.gameStatusManager = this.gameStatusManager;
            console.log('[Preview] 游戏状态管理器已初始化');
        }

        this.hideLoading();
        document.getElementById('game-preview-container').style.display = 'block';
    }

    showGameError() {
        this.hideLoading();
        document.getElementById('game-error').style.display = 'block';
    }

    showError(message) {
        document.getElementById('error-message').textContent = message;
        this.hideLoading();
        document.getElementById('error-state').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading-state').style.display = 'none';
    }

    async fetchAPI(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    message: response.statusText || `HTTP ${response.status}`
                }));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查服务器是否运行');
            }
            throw error;
        }
    }

}



// 全局函数供HTML调用
window.toggleFullscreen = toggleFullscreen;
window.openGameInNewWindow = openGameInNewWindow;
window.refreshGame = refreshGame;

/**
 * 向 iframe 中的 SDK 发送 pushtime 更新
 * @param {number} seconds
 */
function setSdkPushTime(seconds) {
    const iframe = document.getElementById('game-preview');
    if (!iframe) return;

    try {
        const v = Number(seconds) || 1;
        // 使用统一命令格式 ovocommand，子页面 sdk 会监听并处理
        iframe.contentWindow.postMessage({ type: 'iframecommand', command: 'SET_PUSHTIME', value: v }, '*');
        console.log('[Preview] 已向 iframe 发送 SET_PUSHTIME:', v);
    } catch (e) {
        console.warn('[Preview] 发送 SET_PUSHTIME 失败:', e && e.message);
    }
}

window.setSdkPushTime = setSdkPushTime;

window.prepareGame = async function () {
    try {
        const loader = window.previewLoader;
        // 触发准备时也传递 env 参数
        const env = loader.urlParams.get('env') || 'beta';
        const response = await fetch(`/api/v1/games/${loader.gameId}/preview/prepare?platformId=${loader.platformId}&env=${env}`, {
            method: 'POST'
        });

        if (response.ok) {
            location.reload();
        } else {
            const error = await response.json();
            alert(`准备游戏失败: ${error.message}`);
        }
    } catch (error) {
        alert(`准备游戏失败: ${error.message}`);
    }
};

