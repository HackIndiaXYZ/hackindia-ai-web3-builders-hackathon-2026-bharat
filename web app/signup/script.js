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

    // Form elements
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const nameError = document.getElementById('name-error');
    const phoneError = document.getElementById('phone-error');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnArrow = document.getElementById('btn-arrow');
    const btnSpinner = document.getElementById('btn-spinner');

    // Only allow digits in phone
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
        phoneError.textContent = '';
    });
    nameInput.addEventListener('input', () => { nameError.textContent = ''; });

    function setLoading(loading) {
        submitBtn.disabled = loading;
        btnText.textContent = loading ? 'Creating account…' : 'Create Account';
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
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        let valid = true;

        // Validate name
        if (name.length < 2) {
            nameError.textContent = 'Please enter your full name (at least 2 characters).';
            valid = false;
        }

        // Validate phone
        if (phone.length !== 10) {
            phoneError.textContent = 'Please enter a valid 10-digit phone number.';
            valid = false;
        }

        if (!valid) return;

        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('bap-user', JSON.stringify(data.user));
                showToast(`Account created! Welcome, ${data.user.name} 🎉`);
                setTimeout(() => { window.location.href = '/dashboard/home'; }, 1400);
            } else {
                if (data.field === 'phone') {
                    phoneError.textContent = data.error;
                } else {
                    showToast(data.error || 'Registration failed. Please try again.', 'error');
                }
                setLoading(false);
            }
        } catch (err) {
            showToast('Could not connect to server. Is it running?', 'error');
            setLoading(false);
        }
    });
});
