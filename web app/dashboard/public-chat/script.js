document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    
    let userPhone = "Unknown";
    let userName = "Me";
    try {
        const u = JSON.parse(localStorage.getItem('bap-user'));
        if (u) {
            userPhone = u.phone;
            userName = u.name;
        }
    } catch(e) {}

    // Hash function matching Android app (FNV-style)
    function generateHash(sender, text) {
        const str = sender + text + Date.now();
        let hash = 0x811c9dc5;
        for(let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return "BAP-" + Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
    }

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function renderMessage(msg) {
        const isMe = msg.phone === userPhone;
        const bubbleClass = isMe ? 'user-bubble' : 'ai-bubble'; // reuse styles
        const senderLabel = isMe ? 'You' : msg.senderName;
        
        const html = `
            <div class="chat-bubble ${bubbleClass}">
                <div class="bubble-header">
                    <span class="sender-name">${senderLabel}</span>
                    <span class="verification-badge" title="Hash: ${msg.hash}">${msg.hash}</span>
                </div>
                <div class="bubble-content">
                    ${msg.text}
                </div>
            </div>
        `;
        chatHistory.insertAdjacentHTML('beforeend', html);
        scrollToBottom();
    }

    async function loadMessages() {
        try {
            const res = await fetch('/api/public-chat');
            const msgs = await res.json();
            chatHistory.innerHTML = '';
            msgs.forEach(renderMessage);
        } catch(e) {
            chatHistory.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Offline mode: Failed to load global messages.</p>';
        }
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        
        const hash = generateHash(userPhone, text);
        const msgObj = { text, senderName: userName, phone: userPhone, hash };

        // Optimistic render
        renderMessage(msgObj);

        try {
            await fetch('/api/public-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msgObj)
            });
        } catch (err) {
            console.error("Failed to sync message", err);
        }
    });

    loadMessages();
    
    // Poll every 5s for new messages (mocking sync)
    setInterval(loadMessages, 5000);
});
