document.addEventListener('DOMContentLoaded', () => {
    // Theme
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Form
    const form = document.getElementById('signin-form');
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phone-error');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnArrow = document.getElementById('btn-arrow');
    const btnSpinner = document.getElementById('btn-spinner');

    // Only allow digits
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        phoneError.textContent = '';
    });

    function setLoading(loading) {
        submitBtn.disabled = loading;
        btnText.textContent = loading ? 'Signing in…' : 'Sign In';
        btnArrow.classList.toggle('hidden', loading);
        btnSpinner.classList.toggle('hidden', !loading);
    }

    function showToast(message, type = 'success') {
        const icon = type === 'success' ? '✅' : '❌';
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = phoneInput.value.trim();

        // Validate
        if (phone.length !== 10) {
            phoneError.textContent = 'Please enter a valid 10-digit phone number.';
            phoneInput.focus();
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Save user session locally
                localStorage.setItem('bap-user', JSON.stringify(data.user));
                showToast(`Welcome back, ${data.user.name}!`);
                setTimeout(() => { window.location.href = '/dashboard/home'; }, 1200);
            } else {
                phoneError.textContent = data.error || 'Phone number not found. Please sign up first.';
                setLoading(false);
            }
        } catch (err) {
            showToast('Could not connect to server. Is it running?', 'error');
            setLoading(false);
        }
    });
});
