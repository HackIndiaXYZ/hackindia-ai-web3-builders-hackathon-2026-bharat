document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const targetPhone = params.get('phone');

    if (!targetPhone) {
        alert("No contact selected for private chat.");
        window.location.href = '/dashboard/home';
        return;
    }

    // Lookup contact name
    let contactName = targetPhone;
    const contacts = JSON.parse(localStorage.getItem('bap-contacts') || '[]');
    const contact = contacts.find(c => c.phone === targetPhone);
    if (contact) contactName = contact.name;

    document.getElementById('chat-title').textContent = `Chat: ${contactName}`;

    // Get current user
    let userPhone = "Unknown";
    try {
        const u = JSON.parse(localStorage.getItem('bap-user'));
        if (u) userPhone = u.phone;
    } catch(e) {}

    // Simulated E2E local storage key
    const storageKey = `bap-private-${[userPhone, targetPhone].sort().join('-')}`;

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Mock encryption function
    function encryptMock(text) {
        return btoa(text).substring(0, 15) + "..."; 
    }

    function renderMessage(msg) {
        const isMe = msg.sender === userPhone;
        const bubbleClass = isMe ? 'user-bubble' : 'ai-bubble'; 
        const senderLabel = isMe ? 'You' : contactName;
        
        const html = `
            <div class="chat-bubble ${bubbleClass}">
                <div class="bubble-header">
                    <span class="sender-name">${senderLabel}</span>
                    <span class="verification-badge" title="Encrypted Payload: ${encryptMock(msg.text)}">🔒 Encrypted</span>
                </div>
                <div class="bubble-content">
                    ${msg.text}
                </div>
            </div>
        `;
        chatHistory.insertAdjacentHTML('beforeend', html);
        scrollToBottom();
    }

    function loadMessages() {
        const msgs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        msgs.forEach(renderMessage);
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.value = '';
        
        const msgObj = { text, sender: userPhone, timestamp: Date.now() };

        // Save locally (simulating sending E2E encrypted blob to backend)
        const msgs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        msgs.push(msgObj);
        localStorage.setItem(storageKey, JSON.stringify(msgs));

        renderMessage(msgObj);
    });

    loadMessages();
});
