document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const sendBtn = document.getElementById('send-btn');
    const aiModeBadge = document.getElementById('ai-mode-badge');
    
    // Conversation history for Groq context
    const conversationHistory = [];

    let userName = "You";
    try {
        const u = JSON.parse(localStorage.getItem('bap-user'));
        if (u && u.name) userName = u.name;
    } catch(e) {}

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function addMessage(sender, text, isAi = false, source = null) {
        const bubbleClass = isAi ? 'ai-bubble' : 'user-bubble';
        const senderLabel = isAi ? 'BAP Safety AI' : sender;

        let badge = '';
        if (source === 'groq-qwen3') {
            badge = `<span class="verification-badge" style="background:rgba(167,139,250,0.2);color:#a78bfa;border-color:rgba(167,139,250,0.3);" title="Powered by Groq Qwen3">⚡ Groq</span>`;
        } else if (source === 'offline-rules') {
            badge = `<span class="verification-badge" style="background:rgba(251,191,36,0.15);color:#fbbf24;border-color:rgba(251,191,36,0.3);" title="Offline rule-based response">📡 Offline</span>`;
        }
        
        const html = `
            <div class="chat-bubble ${bubbleClass}">
                <div class="bubble-header">
                    <span class="sender-name">${senderLabel}</span>
                    ${badge}
                </div>
                <div class="bubble-content">${text.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        chatHistory.insertAdjacentHTML('beforeend', html);
        scrollToBottom();
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        chatHistory.insertAdjacentHTML('beforeend', `
            <div class="chat-bubble ai-bubble" id="${id}">
                <div class="bubble-content typing-indicator">
                    <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                </div>
            </div>
        `);
        scrollToBottom();
        return id;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        addMessage(userName, text, false);
        // Track for Groq history
        conversationHistory.push({ role: 'user', content: text });

        chatInput.value = '';
        sendBtn.disabled = true;
        chatInput.disabled = true;
        const typingId = addTypingIndicator();

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: conversationHistory.slice(-10) })
            });
            const data = await res.json();
            document.getElementById(typingId)?.remove();
            
            if (res.ok) {
                addMessage('AI', data.reply, true, data.source);
                // Track assistant response for next turn
                conversationHistory.push({ role: 'assistant', content: data.reply });

                // Update badge based on source
                if (aiModeBadge) {
                    if (data.source === 'groq-qwen3') {
                        aiModeBadge.textContent = '⚡ Connected to Groq Qwen3';
                        aiModeBadge.style.color = '#a78bfa';
                    } else {
                        aiModeBadge.textContent = '📡 Offline Mode (Set GROQ_API_KEY)';
                        aiModeBadge.style.color = '#fbbf24';
                    }
                }
            } else {
                document.getElementById(typingId)?.remove();
                addMessage('AI', 'Sorry, I encountered an error. Please try again.', true, null);
            }
        } catch (err) {
            document.getElementById(typingId)?.remove();
            addMessage('AI', 'Connection error. Please check the server is running.', true, null);
        } finally {
            sendBtn.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    });
});

