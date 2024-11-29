class ChatBot {
    constructor() {
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.querySelector('.chat-input');
        this.sendButton = document.querySelector('.send-button');
        this.voiceButton = document.querySelector('.voice-button');
        
        this.messageHistory = [{
            role: "system", 
            content: "你是 Kimi，由 Moonshot AI 提供的人工智能助手。你现在是雷雷的个人助手，可以回答关于雷雷的问题。雷雷是一名全栈开发工程师，热爱编程、摄影和创意设计，同时也是一个环球旅行爱好者。"
        }];
        
        this.isGenerating = false;
        
        this.setupEventListeners();
        this.addMessage('你好！我是雷雷的AI助手，很高兴为你服务。\n你可以问我任何你想知道的问题！', 'bot');
        
        // 添加输入框高度自动调整
        this.chatInput.addEventListener('input', this.adjustInputHeight.bind(this));
    }

    setupEventListeners() {
        this.sendButton.onclick = this.handleSend.bind(this);
        this.chatInput.onkeypress = async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await this.handleSend();
            }
        };
    }

    async handleSend() {
        if (this.isGenerating) return;
        const message = this.chatInput.value.trim();
        if (!message) return;

        try {
            // 显示用户消息
            this.addMessage(message, 'user');
            this.chatInput.value = '';
            
            // 禁用发送按钮
            this.isGenerating = true;
            this.sendButton.classList.add('disabled');
            
            // 调用 Kimi API
            await this.sendToKimi(message);
            
            // 恢复发送按钮
            this.isGenerating = false;
            this.sendButton.classList.remove('disabled');
            
            // 自动滚动到底部
            this.scrollToBottom();
        } catch (error) {
            console.error('Error in handleSend:', error);
            this.addMessage('抱歉，发生了一些错误，请稍后再试。', 'bot');
            this.isGenerating = false;
            this.sendButton.classList.remove('disabled');
        }
    }

    async sendToKimi(message) {
        try {
            console.log('Sending message to Kimi:', message);
            const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer sk-SPTtyDLppo2b9uc3HEBmRkUvPcwQSiE17mP2mo3dCrcBTvg5`
                },
                body: JSON.stringify({
                    model: "moonshot-v1-8k",
                    messages: [...this.messageHistory, { role: "user", content: message }],
                    temperature: 0.3,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 创建一个消息元素用于流式显示
            const messageElement = this.createMessageElement('', 'bot');
            this.chatMessages.appendChild(messageElement);
            const textSpan = messageElement.querySelector('.content');
            
            // 创建响应流读取器
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                // 解码响应数据
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                // 处理每一行数据
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const content = data.choices[0].delta.content || '';
                            fullText += content;
                            textSpan.textContent = fullText;
                            this.scrollToBottom();
                        } catch (e) {
                            console.error('Error parsing chunk:', e);
                        }
                    }
                }
            }

            // 更新消息历史
            this.messageHistory.push({ role: "user", content: message });
            this.messageHistory.push({ role: "assistant", content: fullText });
            
            return fullText;
        } catch (error) {
            console.error('Error calling Kimi API:', error);
            throw error;
        }
    }

    createMessageElement(text, role) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);

        const avatar = document.createElement('img');
        avatar.classList.add('avatar');
        avatar.src = role === 'bot' ? 'images/robot-avatar.png' : 'images/avatar.jpg';
        avatar.alt = role === 'bot' ? 'AI助手头像' : '用户头像';
        messageDiv.appendChild(avatar);

        const content = document.createElement('div');
        content.classList.add('content');
        content.innerHTML = text.replace(/\n/g, '<br>');
        messageDiv.appendChild(content);

        const timestamp = document.createElement('div');
        timestamp.classList.add('timestamp');
        timestamp.textContent = new Date().toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        content.appendChild(timestamp);

        if (role === 'bot' && text === '') {
            const loadingText = document.createElement('div');
            loadingText.classList.add('loading-text');
            loadingText.innerHTML = '正在回答<div class="loading-dots"><span></span><span></span><span></span></div>';
            content.appendChild(loadingText);
        }

        return messageDiv;
    }

    addMessage(text, role) {
        const messageElement = this.createMessageElement(text, role);
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    adjustInputHeight() {
        const input = this.chatInput;
        input.style.height = '45px';  // 重置为最小高度
        
        // 计算实际内容高度
        const scrollHeight = input.scrollHeight;
        const maxHeight = parseInt(window.getComputedStyle(input).maxHeight);
        
        if (scrollHeight > maxHeight) {
            input.style.height = maxHeight + 'px';
            input.classList.add('scrollable');
        } else {
            input.style.height = scrollHeight + 'px';
            input.classList.remove('scrollable');
        }

        // 如果内容为空或只有一行，恢复到最小高度
        if (input.value.trim() === '' || !input.value.includes('\n')) {
            input.style.height = '45px';
            input.classList.remove('scrollable');
        }
    }
}

// 轮播图功能
class Carousel {
    constructor() {
        this.currentSlide = 0;
        this.items = document.querySelectorAll('.carousel-item');
        this.dots = document.querySelector('.carousel-dots');
        this.setupDots();
        this.setupControls();
        this.startAutoSlide();
    }

    setupDots() {
        this.items.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dots.appendChild(dot);
        });
    }

    setupControls() {
        document.querySelector('.carousel-prev').addEventListener('click', () => {
            this.goToSlide(this.currentSlide - 1);
        });

        document.querySelector('.carousel-next').addEventListener('click', () => {
            this.goToSlide(this.currentSlide + 1);
        });
    }

    goToSlide(n) {
        this.items[this.currentSlide].classList.remove('active');
        this.currentSlide = (n + this.items.length) % this.items.length;
        this.items[this.currentSlide].classList.add('active');
        this.updateDots();
    }

    updateDots() {
        const dots = this.dots.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    startAutoSlide() {
        setInterval(() => {
            this.goToSlide(this.currentSlide + 1);
        }, 3000);
    }
}

// 夜间模式
class DarkMode {
    constructor() {
        this.darkModeToggle = document.querySelector('.dark-mode-toggle');
        this.body = document.body;
        
        // 默认使用夜间模式，除非明确禁用
        const storedPreference = localStorage.getItem('darkMode');
        this.darkMode = storedPreference === null ? true : storedPreference !== 'disabled';
        
        this.setupEventListeners();
        this.initialize();
    }

    initialize() {
        if (this.darkMode) {
            this.body.classList.add('dark-mode');
        }
        // 如果是第一次访问，保存默认偏好
        if (localStorage.getItem('darkMode') === null) {
            localStorage.setItem('darkMode', 'enabled');
        }
    }

    setupEventListeners() {
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        this.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.darkMode ? 'enabled' : 'disabled');
    }
}

// 返回顶部
class BackToTop {
    constructor() {
        this.button = document.querySelector('.back-to-top');
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('scroll', () => this.toggleVisibility());
        this.button.addEventListener('click', () => this.scrollToTop());
    }

    toggleVisibility() {
        if (window.pageYOffset > 300) {
            this.button.style.opacity = '1';
            this.button.style.pointerEvents = 'auto';
        } else {
            this.button.style.opacity = '0';
            this.button.style.pointerEvents = 'none';
        }
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new Carousel();
    new ChatBot();
    new DarkMode();
    new BackToTop();
}); 