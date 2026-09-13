document.addEventListener('DOMContentLoaded', () => {
    const sourceText = document.getElementById('source-text');
    const targetText = document.getElementById('target-text');
    const sourceLang = document.getElementById('source-lang');
    const targetLang = document.getElementById('target-lang');
    const swapBtn = document.getElementById('swap-btn');
    const translateBtn = document.getElementById('translate-btn');
    const translateSpinner = document.getElementById('translate-spinner');
    const phraseItems = document.querySelectorAll('.phrase-item');

    // 1. Swap Languages
    swapBtn.addEventListener('click', () => {
        const tempVal = sourceLang.value;
        const tempHtml = sourceLang.innerHTML;

        sourceLang.innerHTML = targetLang.innerHTML;
        sourceLang.value = targetLang.value;

        targetLang.innerHTML = tempHtml;
        targetLang.value = tempVal;

        const textTemp = sourceText.value;
        sourceText.value = targetText.value;
        targetText.value = textTemp;
    });

    // 2. Use Offline Phrase
    phraseItems.forEach(item => {
        item.querySelector('button').addEventListener('click', () => {
            sourceText.value = item.dataset.text;
            // Auto translate if offline phrase used
            performTranslation();
        });
    });

    // 3. Perform Translation via local backend (mocking LibreTranslate/Gemini)
    async function performTranslation() {
        const text = sourceText.value.trim();
        if (!text) {
            targetText.value = '';
            return;
        }

        translateBtn.disabled = true;
        translateSpinner.classList.remove('hidden');
        targetText.value = ''; // clear previous

        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    source: sourceLang.value,
                    target: targetLang.value
                })
            });

            const data = await res.json();
            
            if (res.ok) {
                targetText.value = data.translation;
            } else {
                targetText.value = "Error: " + (data.error || 'Translation failed.');
            }
        } catch (err) {
            console.error(err);
            // Fallback for offline mode simulation
            targetText.value = "[Offline Mode] Mock translation for: " + text;
        } finally {
            translateBtn.disabled = false;
            translateSpinner.classList.add('hidden');
        }
    }

    translateBtn.addEventListener('click', performTranslation);
});
