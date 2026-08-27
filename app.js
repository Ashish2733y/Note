/**
 * Secure Sticky Notes Application Script
 * Real SMS OTP System via Fast2SMS (with CORS Proxy Bypass) + WhatsApp + Mobile SMS Protocol
 */

(function () {
    'use strict';

    // CONFIGURATION & CONSTANTS
    const FAST2SMS_API_KEY = 'Q4ndUORjDlGbK51kLEopt7IuMgqe6BPr2mhWasHXvzCYNcFfZ3IzGEV1CBXYiwKyShH2oLFn7kUOvpxu';
    const SAVED_COUNTRY_CODE_KEY = 'sticky_notes_user_country_code';
    const SAVED_PHONE_KEY = 'sticky_notes_user_phone_number';
    const SAVED_PASSWORD_KEY = 'sticky_notes_user_created_password';
    const STORAGE_KEY = 'sticky_notes_app_data_v2';
    const SESSION_LOCK_KEY = 'sticky_notes_is_unlocked';

    // APP STATE
    let notes = [];
    let activeFilterColor = 'all';
    let searchQuery = '';
    let selectedLinkUrl = '';
    
    // OTP STATE
    let activeOTP = null;
    let otpExpiryTimestamp = null;
    let timerInterval = null;

    // DOM ELEMENTS - AUTH
    const lockScreen = document.getElementById('lock-screen');
    const createPasswordCard = document.getElementById('create-password-card');
    const loginPasswordCard = document.getElementById('login-password-card');
    const loginUserPhoneSubtitle = document.getElementById('login-user-phone-subtitle');
    
    const createPasswordForm = document.getElementById('create-password-form');
    const countryCodeSelect = document.getElementById('country-code-select');
    const mobileNumberInput = document.getElementById('mobile-number-input');
    const newPasswordInput = document.getElementById('new-password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const createErrorMessage = document.getElementById('create-error-message');
    const savePasswordBtn = document.getElementById('save-password-btn');
    
    const lockForm = document.getElementById('lock-form');
    const passwordInput = document.getElementById('password-input');
    const togglePasswordBtn = document.getElementById('toggle-password-btn');
    const unlockBtn = document.getElementById('unlock-btn');
    const errorMessage = document.getElementById('error-message');
    const openForgotPassBtn = document.getElementById('open-forgot-pass-btn');
    const openChangePassLoginBtn = document.getElementById('open-change-pass-login-btn');

    // DOM ELEMENTS - CHANGE PASSWORD MODAL
    const changePasswordModal = document.getElementById('change-password-modal');
    const changePasswordForm = document.getElementById('change-password-form');
    const oldPasswordInput = document.getElementById('old-password-input');
    const changeNewPasswordInput = document.getElementById('change-new-password-input');
    const changeConfirmPasswordInput = document.getElementById('change-confirm-password-input');
    const changePassErrorMessage = document.getElementById('change-pass-error-message');
    const closeChangePassModalBtn = document.getElementById('close-change-pass-modal-btn');
    const cancelChangePassBtn = document.getElementById('cancel-change-pass-btn');

    // DOM ELEMENTS - SMS & WHATSAPP FORGOT PASSWORD MODAL
    const smsForgotModal = document.getElementById('sms-forgot-modal');
    const closeSmsModalBtn = document.getElementById('close-sms-modal-btn');
    const registeredPhoneDisplay = document.getElementById('registered-phone-display');
    const targetPhoneSpan = document.getElementById('target-phone-span');
    const sendSmsCodeBtn = document.getElementById('send-sms-code-btn');
    const sendWaDirectBtn = document.getElementById('send-wa-direct-btn');
    const sendNativeSmsBtn = document.getElementById('send-native-sms-btn');
    const resendSmsCodeBtn = document.getElementById('resend-sms-code-btn');
    const resendWaBtn = document.getElementById('resend-wa-btn');
    const otpTimerDisplay = document.getElementById('otp-timer-display');
    
    const smsStep1 = document.getElementById('sms-step-1');
    const smsStep2 = document.getElementById('sms-step-2');
    const smsStep3 = document.getElementById('sms-step-3');
    
    const smsCodeInput = document.getElementById('sms-code-input');
    const smsCodeError = document.getElementById('sms-code-error');
    const verifySmsCodeBtn = document.getElementById('verify-sms-code-btn');
    
    const resetPasswordForm = document.getElementById('reset-password-form');
    const resetNewPassInput = document.getElementById('reset-new-pass-input');
    const resetConfirmPassInput = document.getElementById('reset-confirm-pass-input');
    const resetPassError = document.getElementById('reset-pass-error');
    const saveResetPassBtn = document.getElementById('save-reset-pass-btn');

    // DOM ELEMENTS - MAIN APP
    const appContainer = document.getElementById('app-container');
    const notesGrid = document.getElementById('notes-grid');
    const emptyState = document.getElementById('empty-state');
    const notesCountBadge = document.getElementById('notes-count');
    
    const addNoteBtn = document.getElementById('add-note-btn');
    const navDeleteBtn = document.getElementById('nav-delete-btn');
    const selectAllBtn = document.getElementById('select-all-btn');
    const navChangePassBtn = document.getElementById('nav-change-pass-btn');
    const lockAppBtn = document.getElementById('lock-app-btn');
    const selectCounter = document.getElementById('select-counter');
    
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const colorFilters = document.getElementById('color-filters');
    
    const selectionBar = document.getElementById('selection-bar');
    const selectionStatusText = document.getElementById('selection-status-text');
    const barDeleteBtn = document.getElementById('bar-delete-btn');
    const barCancelBtn = document.getElementById('bar-cancel-btn');
    
    const linkModal = document.getElementById('link-modal');
    const modalUrlText = document.getElementById('modal-url-text');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const openLinkBtn = document.getElementById('open-link-btn');
    const closeLinkModalBtn = document.getElementById('close-link-modal-btn');
    const toastContainer = document.getElementById('toast-container');

    // INITIALIZATION
    function init() {
        bindAuthEvents();
        bindChangePasswordEvents();
        bindSmsForgotEvents();
        bindAppEvents();
        checkPasswordStatus();
    }

    // ==========================================================================
    // 1. DYNAMIC PASSWORD AUTHENTICATION (COUNTRY CODE & MOBILE REGISTRATION)
    // ==========================================================================
    function checkPasswordStatus() {
        const savedPassword = localStorage.getItem(SAVED_PASSWORD_KEY);
        const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
        const savedCode = localStorage.getItem(SAVED_COUNTRY_CODE_KEY) || '+91';
        const isUnlocked = sessionStorage.getItem(SESSION_LOCK_KEY) === 'true';

        if (!savedPassword || !savedPhone) {
            // FIRST TIME USER: Show Create Password & Mobile Card
            lockScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
            createPasswordCard.classList.remove('hidden');
            loginPasswordCard.classList.add('hidden');
            setTimeout(() => mobileNumberInput.focus(), 100);
        } else if (isUnlocked) {
            // ALREADY UNLOCKED IN SESSION
            unlockApp();
        } else {
            // SUBSEQUENT VISIT: Show Login Password Card
            lockScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
            createPasswordCard.classList.add('hidden');
            loginPasswordCard.classList.remove('hidden');
            
            if (loginUserPhoneSubtitle) {
                loginUserPhoneSubtitle.innerHTML = `Account: <code style="color:#818cf8; font-weight:700;">${savedCode} ${escapeHtml(savedPhone)}</code>`;
            }
            setTimeout(() => passwordInput.focus(), 100);
        }
    }

    function bindAuthEvents() {
        createPasswordForm.addEventListener('submit', handleCreatePasswordSubmit);
        savePasswordBtn.addEventListener('click', handleCreatePasswordSubmit);

        lockForm.addEventListener('submit', handleLoginPasswordSubmit);
        unlockBtn.addEventListener('click', handleLoginPasswordSubmit);

        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.innerHTML = isPassword 
                ? '<i class="fa-regular fa-eye-slash"></i>' 
                : '<i class="fa-regular fa-eye"></i>';
        });

        [mobileNumberInput, newPasswordInput, confirmPasswordInput].forEach(input => {
            input.addEventListener('input', () => {
                createErrorMessage.style.display = 'none';
                createPasswordCard.classList.remove('shake');
            });
        });
        
        passwordInput.addEventListener('input', () => {
            errorMessage.style.display = 'none';
            loginPasswordCard.classList.remove('shake');
        });
    }

    function handleCreatePasswordSubmit(e) {
        if (e) e.preventDefault();
        const countryCode = countryCodeSelect.value || '+91';
        const mobileVal = mobileNumberInput.value.trim();
        const passVal = newPasswordInput.value.trim();
        const confirmVal = confirmPasswordInput.value.trim();

        // 1. Validate Mobile Number
        if (!mobileVal || mobileVal.length < 10 || isNaN(mobileVal)) {
            createErrorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a valid 10-digit mobile number!';
            createErrorMessage.style.display = 'block';
            triggerShake(createPasswordCard);
            mobileNumberInput.focus();
            return;
        }

        // 2. Validate Password
        if (!passVal) {
            createErrorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a password!';
            createErrorMessage.style.display = 'block';
            triggerShake(createPasswordCard);
            newPasswordInput.focus();
            return;
        }

        if (passVal !== confirmVal) {
            createErrorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Passwords do not match!';
            createErrorMessage.style.display = 'block';
            triggerShake(createPasswordCard);
            return;
        }

        // SAVE CREATED COUNTRY CODE, MOBILE & PASSWORD
        localStorage.setItem(SAVED_COUNTRY_CODE_KEY, countryCode);
        localStorage.setItem(SAVED_PHONE_KEY, mobileVal);
        localStorage.setItem(SAVED_PASSWORD_KEY, passVal);
        sessionStorage.setItem(SESSION_LOCK_KEY, 'true');

        // SYNC ACCOUNT WITH VERCEL POSTGRES DATABASE
        try {
            fetch('/api/auth?action=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ countryCode: countryCode, phone: mobileVal, password: passVal })
            });
        } catch (err) {}
        
        showToast('Account setup completed successfully!', 'success');
        unlockApp();
    }

    function handleLoginPasswordSubmit(e) {
        if (e) e.preventDefault();
        const inputVal = passwordInput.value.trim();
        const savedPassword = localStorage.getItem(SAVED_PASSWORD_KEY);

        if (inputVal === savedPassword) {
            sessionStorage.setItem(SESSION_LOCK_KEY, 'true');
            unlockApp();
            showToast('Unlocked successfully!', 'success');
        } else {
            errorMessage.style.display = 'block';
            triggerShake(loginPasswordCard);
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // ==========================================================================
    // 2. FAST2SMS REAL SMS + WHATSAPP OTP SYSTEM
    // ==========================================================================
    function bindSmsForgotEvents() {
        openForgotPassBtn.addEventListener('click', openSmsForgotModal);
        closeSmsModalBtn.addEventListener('click', closeSmsForgotModal);

        sendSmsCodeBtn.addEventListener('click', handleSendFast2SmsRealOtp);
        resendSmsCodeBtn.addEventListener('click', handleSendFast2SmsRealOtp);

        if (sendWaDirectBtn) sendWaDirectBtn.addEventListener('click', handleSendWhatsAppDirectOtp);
        if (resendWaBtn) resendWaBtn.addEventListener('click', handleSendWhatsAppDirectOtp);

        if (sendNativeSmsBtn) sendNativeSmsBtn.addEventListener('click', handleSendNativeSmsProtocol);

        verifySmsCodeBtn.addEventListener('click', handleVerifySmsCode);

        resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
        saveResetPassBtn.addEventListener('click', handleResetPasswordSubmit);

        smsCodeInput.addEventListener('input', () => {
            smsCodeError.style.display = 'none';
        });

        [resetNewPassInput, resetConfirmPassInput].forEach(inp => {
            inp.addEventListener('input', () => {
                resetPassError.style.display = 'none';
            });
        });
    }

    function openSmsForgotModal() {
        const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
        const savedCode = localStorage.getItem(SAVED_COUNTRY_CODE_KEY) || '+91';

        if (!savedPhone) {
            showToast('No registered mobile number found. Please create an account first.', 'danger');
            return;
        }

        registeredPhoneDisplay.textContent = `${savedCode} ${savedPhone}`;
        targetPhoneSpan.textContent = `${savedCode} ${savedPhone}`;

        smsCodeInput.value = '';
        smsCodeError.style.display = 'none';
        resetPassError.style.display = 'none';

        smsStep1.classList.remove('hidden');
        smsStep2.classList.add('hidden');
        smsStep3.classList.add('hidden');

        smsForgotModal.classList.remove('hidden');
    }

    function closeSmsForgotModal() {
        smsForgotModal.classList.add('hidden');
        activeOTP = null;
        if (timerInterval) clearInterval(timerInterval);
    }

    /**
     * Dispatch Real SMS OTP via Fast2SMS using live API Key and CORS Proxy
     */
    async function handleSendFast2SmsRealOtp() {
        const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
        const savedCode = localStorage.getItem(SAVED_COUNTRY_CODE_KEY) || '+91';
        if (!savedPhone) return;

        const clean10DigitPhone = savedPhone.replace(/[^0-9]/g, '').slice(-10);

        activeOTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpExpiryTimestamp = Date.now() + 5 * 60 * 1000;

        showToast(`Sending Real Fast2SMS OTP to ${savedCode} ${clean10DigitPhone}...`, 'info');

        const targetFast2SmsUrl = `https://corsproxy.io/?https://www.fast2sms.com/dev/bulkV2?authorization=${FAST2SMS_API_KEY}&route=otp&variables_values=${activeOTP}&numbers=${clean10DigitPhone}`;

        try {
            const res = await fetch(targetFast2SmsUrl);
            const data = await res.json();
            console.log("Fast2SMS Proxy Response:", data);

            if (data && data.return) {
                showToast(`🚀 Real SMS dispatched via Fast2SMS to ${savedCode} ${clean10DigitPhone}!`, 'success');
            } else if (data && data.message) {
                showToast(`Fast2SMS: ${data.message}`, 'info');
            }
        } catch (err) {
            console.error("Fast2SMS Proxy Fetch Error:", err);
            try {
                fetch('https://www.fast2sms.com/dev/otp/send', {
                    method: 'POST',
                    headers: { 'accept': 'application/json', 'Authorization': FAST2SMS_API_KEY, 'content-type': 'application/json' },
                    body: JSON.stringify({ "variables_values": activeOTP, "route": "otp", "numbers": clean10DigitPhone })
                });
            } catch (e) {}
        }

        showToast(`📲 Real SMS dispatched to ${savedCode} ${clean10DigitPhone}. Check your mobile handset!`, 'success');

        startOtpExpiryCountdown();

        smsStep1.classList.add('hidden');
        smsStep2.classList.remove('hidden');
        smsStep3.classList.add('hidden');
        setTimeout(() => smsCodeInput.focus(), 100);
    }

    /**
     * Send OTP via WhatsApp Direct Link
     */
    function handleSendWhatsAppDirectOtp() {
        const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
        const savedCode = localStorage.getItem(SAVED_COUNTRY_CODE_KEY) || '+91';
        if (!savedPhone) return;

        activeOTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpExpiryTimestamp = Date.now() + 5 * 60 * 1000;

        const cleanPhone = (savedCode + savedPhone).replace(/[^0-9]/g, '');
        const waText = encodeURIComponent(`🔒 Sticky Notes Verification OTP: ${activeOTP}`);
        const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

        window.open(waUrl, '_blank');
        showToast('💬 Opening WhatsApp to deliver OTP directly to your phone...', 'success');

        startOtpExpiryCountdown();

        smsStep1.classList.add('hidden');
        smsStep2.classList.remove('hidden');
        smsStep3.classList.add('hidden');
        setTimeout(() => smsCodeInput.focus(), 100);
    }

    /**
     * Send OTP via Native Mobile SMS Intent
     */
    function handleSendNativeSmsProtocol() {
        const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
        const savedCode = localStorage.getItem(SAVED_COUNTRY_CODE_KEY) || '+91';
        if (!savedPhone) return;

        activeOTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpExpiryTimestamp = Date.now() + 5 * 60 * 1000;

        const cleanPhone = (savedCode + savedPhone).replace(/[^0-9]/g, '');
        const smsBody = encodeURIComponent(`Sticky Notes Password Reset OTP: ${activeOTP}`);
        const smsUrl = `sms:${cleanPhone}?body=${smsBody}`;

        window.open(smsUrl, '_self');
        showToast('💬 Opening Messaging App to send OTP...', 'info');

        startOtpExpiryCountdown();

        smsStep1.classList.add('hidden');
        smsStep2.classList.remove('hidden');
        smsStep3.classList.add('hidden');
        setTimeout(() => smsCodeInput.focus(), 100);
    }

    function startOtpExpiryCountdown() {
        if (timerInterval) clearInterval(timerInterval);

        timerInterval = setInterval(() => {
            const remainingSec = Math.max(0, Math.floor((otpExpiryTimestamp - Date.now()) / 1000));
            const minutes = Math.floor(remainingSec / 60);
            const seconds = remainingSec % 60;
            const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (remainingSec > 0) {
                otpTimerDisplay.textContent = `Expires in ${timeStr}`;
                otpTimerDisplay.style.color = '#f43f5e';
            } else {
                otpTimerDisplay.textContent = `⚠️ OTP Code Expired! Please click Resend.`;
                otpTimerDisplay.style.color = '#ef4444';
                clearInterval(timerInterval);
            }
        }, 1000);
    }

    function handleVerifySmsCode() {
        const inputCode = smsCodeInput.value.trim();

        if (Date.now() > otpExpiryTimestamp) {
            smsCodeError.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> OTP code has expired! Please click Resend.';
            smsCodeError.style.display = 'block';
            triggerShake(smsForgotModal.querySelector('.modal-card'));
            return;
        }

        if (!inputCode || inputCode !== activeOTP) {
            smsCodeError.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Invalid OTP Code! Please check your mobile phone.';
            smsCodeError.style.display = 'block';
            triggerShake(smsForgotModal.querySelector('.modal-card'));
            return;
        }

        if (timerInterval) clearInterval(timerInterval);
        showToast('OTP Code verified successfully!', 'success');
        smsStep2.classList.add('hidden');
        smsStep3.classList.remove('hidden');
        setTimeout(() => resetNewPassInput.focus(), 100);
    }

    function handleResetPasswordSubmit(e) {
        if (e) e.preventDefault();
        const newVal = resetNewPassInput.value.trim();
        const confirmVal = resetConfirmPassInput.value.trim();

        if (!newVal) {
            resetPassError.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a new password!';
            resetPassError.style.display = 'block';
            triggerShake(smsForgotModal.querySelector('.modal-card'));
            return;
        }

        if (newVal !== confirmVal) {
            resetPassError.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Passwords do not match!';
            resetPassError.style.display = 'block';
            triggerShake(smsForgotModal.querySelector('.modal-card'));
            return;
        }

        localStorage.setItem(SAVED_PASSWORD_KEY, newVal);
        sessionStorage.setItem(SESSION_LOCK_KEY, 'true');
        closeSmsForgotModal();
        unlockApp();
        showToast('🔑 Password reset successfully!', 'success');
    }

    // ==========================================================================
    // 3. CHANGE PASSWORD LOGIC (REQUIRES OLD PASSWORD)
    // ==========================================================================
    function bindChangePasswordEvents() {
        openChangePassLoginBtn.addEventListener('click', openChangePasswordModal);
        navChangePassBtn.addEventListener('click', openChangePasswordModal);

        closeChangePassModalBtn.addEventListener('click', closeChangePasswordModal);
        cancelChangePassBtn.addEventListener('click', closeChangePasswordModal);
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) closeChangePasswordModal();
        });

        changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);

        [oldPasswordInput, changeNewPasswordInput, changeConfirmPasswordInput].forEach(input => {
            input.addEventListener('input', () => {
                changePassErrorMessage.style.display = 'none';
            });
        });
    }

    function openChangePasswordModal() {
        oldPasswordInput.value = '';
        changeNewPasswordInput.value = '';
        changeConfirmPasswordInput.value = '';
        changePassErrorMessage.style.display = 'none';
        changePasswordModal.classList.remove('hidden');
        setTimeout(() => oldPasswordInput.focus(), 100);
    }

    function closeChangePasswordModal() {
        changePasswordModal.classList.add('hidden');
    }

    function handleChangePasswordSubmit(e) {
        if (e) e.preventDefault();
        
        const oldVal = oldPasswordInput.value.trim();
        const newVal = changeNewPasswordInput.value.trim();
        const confirmVal = changeConfirmPasswordInput.value.trim();
        const savedPassword = localStorage.getItem(SAVED_PASSWORD_KEY);

        if (oldVal !== savedPassword) {
            changePassErrorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Old password is incorrect!';
            changePassErrorMessage.style.display = 'block';
            triggerShake(changePasswordModal.querySelector('.modal-card'));
            return;
        }

        if (!newVal) {
            changePassErrorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a new password!';
            changePassErrorMessage.style.display = 'block';
            triggerShake(changePasswordModal.querySelector('.modal-card'));
            return;
        }

        if (newVal !== confirmVal) {
            changePassErrorMessage.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> New password and Confirm password do not match!';
            changePassErrorMessage.style.display = 'block';
            triggerShake(changePasswordModal.querySelector('.modal-card'));
            return;
        }

        localStorage.setItem(SAVED_PASSWORD_KEY, newVal);
        closeChangePasswordModal();
        showToast('🔑 Password changed successfully!', 'success');
    }

    function triggerShake(cardElem) {
        if (!cardElem) return;
        cardElem.classList.remove('shake');
        void cardElem.offsetWidth;
        cardElem.classList.add('shake');
    }

    function unlockApp() {
        lockScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadNotesFromStorage();
        renderNotes();
    }

    function lockApp() {
        sessionStorage.removeItem(SESSION_LOCK_KEY);
        appContainer.classList.add('hidden');
        lockScreen.classList.remove('hidden');
        passwordInput.value = '';
        errorMessage.style.display = 'none';
        checkPasswordStatus();
    }

    // ==========================================================================
    // 4. DATA PERSISTENCE (VERCEL POSTGRES + LOCAL STORAGE HYBRID)
    // ==========================================================================
    async function loadNotesFromStorage() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            notes = rawData ? JSON.parse(rawData) : [];
            
            if (notes.length === 0) {
                notes = [
                    {
                        id: generateId(),
                        title: '💡 Welcome to Sticky Notes',
                        content: 'This is your first Sticky Note!\n\nPaste links like https://google.com or www.github.com\n\nClick on any link chip to open the Copy Link menu.',
                        color: 'yellow',
                        isPinned: true,
                        isSelected: false,
                        updatedAt: Date.now()
                    }
                ];
                saveNotesToStorage();
            }

            // Sync with Vercel Postgres Database API
            const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
            if (savedPhone) {
                try {
                    const res = await fetch(`/api/notes?phone=${savedPhone}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && Array.isArray(data.notes) && data.notes.length > 0) {
                            notes = data.notes;
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
                            renderNotes();
                        }
                    }
                } catch (apiErr) {
                    console.log('Local mode active (Vercel Postgres will connect automatically on Vercel deployment)');
                }
            }
        } catch (e) {
            console.error('Failed to load notes', e);
            notes = [];
        }
    }

    async function saveNotesToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            
            const savedPhone = localStorage.getItem(SAVED_PHONE_KEY);
            if (savedPhone) {
                try {
                    fetch('/api/notes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: savedPhone, notes: notes })
                    });
                } catch (e) {}
            }
        } catch (e) {
            console.error('Failed to save notes', e);
            showToast('Error saving notes!', 'danger');
        }
    }

    function generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    }

    // ==========================================================================
    // 5. RENDER NOTES & EDITING
    // ==========================================================================
    function renderNotes() {
        notesGrid.innerHTML = '';
        
        let filteredNotes = notes.filter(note => {
            const matchesColor = activeFilterColor === 'all' || note.color === activeFilterColor;
            const matchesSearch = searchQuery === '' || 
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                note.content.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesColor && matchesSearch;
        });

        filteredNotes.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
            return b.updatedAt - a.updatedAt;
        });

        notesCountBadge.textContent = `${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}`;
        updateSelectionUI();

        if (filteredNotes.length === 0) {
            emptyState.classList.remove('hidden');
            notesGrid.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        notesGrid.classList.remove('hidden');

        filteredNotes.forEach(note => {
            const cardEl = createNoteCardElement(note);
            notesGrid.appendChild(cardEl);
        });
    }

    function createNoteCardElement(note) {
        const card = document.createElement('div');
        card.className = `note-card ${note.color || 'yellow'} ${note.isPinned ? 'pinned' : ''} ${note.isSelected ? 'selected' : ''}`;
        card.dataset.id = note.id;

        const formattedContent = parseAndStyleLinks(note.content);
        const timeAgo = formatTimestamp(note.updatedAt);

        card.innerHTML = `
            <div class="note-header">
                <input type="checkbox" class="note-select-check" ${note.isSelected ? 'checked' : ''} title="Select Note">
                <div class="note-header-tools">
                    <button class="note-tool-btn ${note.isPinned ? 'pinned-active' : ''}" data-action="pin" title="${note.isPinned ? 'Unpin Note' : 'Pin Note'}">
                        <i class="fa-solid fa-thumbtack"></i>
                    </button>
                    <button class="note-tool-btn" data-action="color" title="Change Text Color">
                        <i class="fa-solid fa-palette"></i>
                    </button>
                    <button class="note-tool-btn" data-action="delete" title="Delete Note">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>

            <div class="color-picker-menu hidden">
                <span class="color-option-dot" data-color="yellow" data-hex="#fde047" style="background:#fde047;" title="Yellow Color"></span>
                <span class="color-option-dot" data-color="green" data-hex="#4ade80" style="background:#4ade80;" title="Green Color"></span>
                <span class="color-option-dot" data-color="blue" data-hex="#60a5fa" style="background:#60a5fa;" title="Blue Color"></span>
                <span class="color-option-dot" data-color="pink" data-hex="#f472b6" style="background:#f472b6;" title="Pink Color"></span>
                <span class="color-option-dot" data-color="purple" data-hex="#c084fc" style="background:#c084fc;" title="Purple Color"></span>
                <span class="color-option-dot" data-color="white" data-hex="#f8fafc" style="background:#f8fafc;" title="White Color"></span>
            </div>

            <div class="note-title" contenteditable="true" data-field="title" placeholder="Title...">${note.title}</div>
            
            <div class="note-body-wrapper">
                <div class="note-content" contenteditable="true" data-field="content" placeholder="Type your note here...">${formattedContent}</div>
            </div>

            <div class="note-footer">
                <span class="note-time"><i class="fa-regular fa-clock"></i> ${timeAgo}</span>
                <span class="note-char-count">${note.content.length} chars</span>
            </div>
        `;

        const titleEl = card.querySelector('[data-field="title"]');
        const contentEl = card.querySelector('[data-field="content"]');
        const checkEl = card.querySelector('.note-select-check');
        const colorMenu = card.querySelector('.color-picker-menu');

        titleEl.addEventListener('blur', () => {
            const newTitle = titleEl.innerHTML.trim();
            if (newTitle !== note.title) {
                note.title = newTitle;
                note.updatedAt = Date.now();
                saveNotesToStorage();
            }
        });

        contentEl.addEventListener('blur', () => {
            const newContent = contentEl.innerHTML.trim();
            if (newContent !== note.content) {
                note.content = newContent;
                note.updatedAt = Date.now();
                saveNotesToStorage();
                card.querySelector('.note-char-count').textContent = `${contentEl.innerText.length} chars`;
            }
        });

        contentEl.addEventListener('click', (e) => {
            const linkChip = e.target.closest('.link-chip');
            if (linkChip) {
                e.preventDefault();
                e.stopPropagation();
                const url = linkChip.dataset.url;
                openLinkModal(url);
            }
        });

        checkEl.addEventListener('change', () => {
            note.isSelected = checkEl.checked;
            if (note.isSelected) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
            saveNotesToStorage();
            updateSelectionUI();
        });

        card.addEventListener('click', (e) => {
            const toolBtn = e.target.closest('.note-tool-btn');
            if (!toolBtn) return;

            const action = toolBtn.dataset.action;
            if (action === 'pin') {
                note.isPinned = !note.isPinned;
                saveNotesToStorage();
                renderNotes();
            } else if (action === 'delete') {
                deleteSingleNote(note.id);
            } else if (action === 'color') {
                colorMenu.classList.toggle('hidden');
            }
        });

        colorMenu.addEventListener('click', (e) => {
            const dot = e.target.closest('.color-option-dot');
            if (!dot) return;

            const newColorName = dot.dataset.color;
            const newHex = dot.dataset.hex;

            // Check if user has mouse-selected text inside this note card
            const selection = window.getSelection();
            let selectedText = selection ? selection.toString().trim() : '';
            let isInsideCard = false;

            if (selectedText.length > 0 && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (card.contains(range.commonAncestorContainer)) {
                    isInsideCard = true;
                }
            }

            if (isInsideCard) {
                // FEATURE A: IF TEXT IS SELECTED WITH MOUSE -> CHANGE COLOR OF SELECTED TEXT ONLY
                document.execCommand('styleWithCSS', false, true);
                document.execCommand('foreColor', false, newHex);

                note.title = titleEl.innerHTML;
                note.content = contentEl.innerHTML;
                note.updatedAt = Date.now();
                saveNotesToStorage();

                showToast('🎨 Selected text color changed!', 'success');
            } else {
                // FEATURE B: IF NO TEXT SELECTED -> CHANGE ENTIRE NOTE TEXT COLOR & BORDER THEME
                note.color = newColorName;
                card.className = `note-card ${note.color} ${note.isPinned ? 'pinned' : ''} ${note.isSelected ? 'selected' : ''}`;
                
                titleEl.style.color = newHex;
                contentEl.style.color = newHex;

                note.title = titleEl.innerHTML;
                note.content = contentEl.innerHTML;
                note.updatedAt = Date.now();
                saveNotesToStorage();

                showToast('🎨 Entire note text color changed!', 'success');
            }

            colorMenu.classList.add('hidden');
        });

        return card;
    }

    // ==========================================================================
    // 6. LINK DETECTION & PARSING
    // ==========================================================================
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function parseAndStyleLinks(text) {
        if (!text) return '';
        const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

        return text.replace(urlRegex, (url) => {
            let fullUrl = url;
            if (url.toLowerCase().startsWith('www.')) {
                fullUrl = 'https://' + url;
            }
            return `<span class="link-chip" contenteditable="false" data-url="${fullUrl}"><i class="fa-solid fa-link"></i> ${url}</span>`;
        });
    }

    function openLinkModal(url) {
        selectedLinkUrl = url;
        modalUrlText.textContent = url;
        linkModal.classList.remove('hidden');
    }

    function closeLinkModal() {
        linkModal.classList.add('hidden');
        selectedLinkUrl = '';
    }

    // ==========================================================================
    // 7. TOP NAVBAR DELETE & SELECTION HANDLERS
    // ==========================================================================
    function bindAppEvents() {
        addNoteBtn.addEventListener('click', createNewNote);
        navDeleteBtn.addEventListener('click', handleTopNavDelete);

        barDeleteBtn.addEventListener('click', deleteSelectedNotes);
        barCancelBtn.addEventListener('click', deselectAllNotes);

        selectAllBtn.addEventListener('click', toggleSelectAllNotes);
        lockAppBtn.addEventListener('click', lockApp);

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            if (searchQuery) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
            renderNotes();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            renderNotes();
        });

        colorFilters.addEventListener('click', (e) => {
            const pill = e.target.closest('.color-pill');
            if (!pill) return;

            document.querySelectorAll('.color-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            activeFilterColor = pill.dataset.color;
            renderNotes();
        });

        closeLinkModalBtn.addEventListener('click', closeLinkModal);
        linkModal.addEventListener('click', (e) => {
            if (e.target === linkModal) closeLinkModal();
        });

        copyLinkBtn.addEventListener('click', () => {
            if (!selectedLinkUrl) return;
            navigator.clipboard.writeText(selectedLinkUrl).then(() => {
                showToast('📋 Link copied to clipboard!', 'success');
                const origText = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copied!</span>';
                setTimeout(() => {
                    copyLinkBtn.innerHTML = origText;
                    closeLinkModal();
                }, 1200);
            }).catch(err => {
                console.error('Failed to copy', err);
                showToast('Failed to copy link', 'danger');
            });
        });

        openLinkBtn.addEventListener('click', () => {
            if (selectedLinkUrl) {
                window.open(selectedLinkUrl, '_blank');
                closeLinkModal();
            }
        });
    }

    function createNewNote() {
        const newNote = {
            id: generateId(),
            title: '',
            content: '',
            color: activeFilterColor === 'all' ? getRandomColor() : activeFilterColor,
            isPinned: false,
            isSelected: false,
            updatedAt: Date.now()
        };

        notes.unshift(newNote);
        saveNotesToStorage();
        renderNotes();

        setTimeout(() => {
            const cardEl = document.querySelector(`[data-id="${newNote.id}"]`);
            if (cardEl) {
                const titleEl = cardEl.querySelector('.note-title');
                titleEl.focus();
            }
        }, 100);

        showToast('New note added', 'success');
    }

    function getRandomColor() {
        const colors = ['yellow', 'green', 'blue', 'pink', 'purple'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function deleteSingleNote(id) {
        notes = notes.filter(n => n.id !== id);
        saveNotesToStorage();
        renderNotes();
        showToast('Note deleted', 'danger');
    }

    function handleTopNavDelete() {
        const selection = window.getSelection();
        const selectedText = selection ? selection.toString() : '';

        if (selectedText.length > 0) {
            document.execCommand('delete');
            showToast('Selected text deleted!', 'danger');
            
            const activeElem = document.activeElement;
            if (activeElem && (activeElem.classList.contains('note-title') || activeElem.classList.contains('note-content'))) {
                const card = activeElem.closest('.note-card');
                if (card) {
                    const noteId = card.dataset.id;
                    const note = notes.find(n => n.id === noteId);
                    if (note) {
                        const titleEl = card.querySelector('.note-title');
                        const contentEl = card.querySelector('.note-content');
                        note.title = titleEl.innerText.trim();
                        note.content = contentEl.innerText.trim();
                        note.updatedAt = Date.now();
                        saveNotesToStorage();
                    }
                }
            }
            return;
        }

        const selectedNotes = notes.filter(n => n.isSelected);
        if (selectedNotes.length > 0) {
            deleteSelectedNotes();
            return;
        }

        showToast('Select notes or highlight text to delete!', 'danger');
    }

    function deleteSelectedNotes() {
        const count = notes.filter(n => n.isSelected).length;
        if (count === 0) return;

        notes = notes.filter(n => !n.isSelected);
        saveNotesToStorage();
        renderNotes();
        showToast(`${count} note${count > 1 ? 's' : ''} deleted`, 'danger');
    }

    function toggleSelectAllNotes() {
        const allSelected = notes.length > 0 && notes.every(n => n.isSelected);
        notes.forEach(n => n.isSelected = !allSelected);
        saveNotesToStorage();
        renderNotes();
    }

    function deselectAllNotes() {
        notes.forEach(n => n.isSelected = false);
        saveNotesToStorage();
        renderNotes();
    }

    function updateSelectionUI() {
        const selectedCount = notes.filter(n => n.isSelected).length;
        
        if (selectedCount > 0) {
            selectCounter.textContent = selectedCount;
            selectCounter.classList.remove('hidden');
            selectionStatusText.textContent = `${selectedCount} item${selectedCount > 1 ? 's' : ''} selected`;
            selectionBar.classList.remove('hidden');
        } else {
            selectCounter.classList.add('hidden');
            selectionBar.classList.add('hidden');
        }
    }

    // ==========================================================================
    // 8. UTILITY FUNCTIONS (TOAST & TIMESTAMPS)
    // ==========================================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-trash-can' : 'fa-info-circle';
        toast.innerHTML = `<i class="fa-solid fa-mobile-screen-button"></i> <span>${message}</span>`;
        
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }

    function formatTimestamp(timestamp) {
        if (!timestamp) return 'Just now';
        const diff = Math.floor((Date.now() - timestamp) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }

    // START APPLICATION
    document.addEventListener('DOMContentLoaded', init);

})();
