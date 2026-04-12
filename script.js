/* script.js */
document.addEventListener('DOMContentLoaded', () => {
  let currentScreen = 0;
  const screens = document.querySelectorAll('.screen');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const totalScreens = screens.length;
  // Subtracting Welcome(1) and Success(1) screens from total form steps
  const totalSteps = totalScreens - 2;

  const formData = {
    name: '',
    email: '',
    interest: '',
    details: ''
  };

  const updateProgress = () => {
    let progress = 0;

    if (currentScreen === 0) {
      progress = 0;
      progressText.textContent = `Start`;
    } else if (currentScreen === totalScreens - 1) {
      progress = 100;
      progressText.textContent = `Done`;
    } else {
      progress = (currentScreen / totalSteps) * 100;
      progressText.textContent = `${currentScreen} / ${totalSteps}`;
    }

    progressBar.style.width = `${progress}%`;
  };

  const showScreen = (index) => {
    screens.forEach((screen, i) => {
      if (i === index) {
        screen.classList.remove('previous');
        screen.classList.add('active');

        // Auto-focus input after transition
        const input = screen.querySelector('input, textarea');
        if (input) {
          setTimeout(() => {
            input.focus();
          }, 400); // Wait for CSS transition
        }
      } else if (i < index) {
        screen.classList.remove('active');
        screen.classList.add('previous');
      } else {
        screen.classList.remove('active', 'previous');
      }
    });

    updateProgress();
  };

  const validateCurrentScreen = () => {
    const currentActive = screens[currentScreen];
    const input = currentActive.querySelector('input, textarea');

    if (input && input.hasAttribute('required')) {
      if (!input.value.trim()) {
        const inputGroup = currentActive.querySelector('.input-group');
        inputGroup.classList.remove('error-shake');
        // trigger reflow
        void inputGroup.offsetWidth;
        inputGroup.classList.add('error-shake');

        const focusBorder = currentActive.querySelector('.focus-border');
        if (focusBorder) {
          focusBorder.style.backgroundColor = '#ef4444';
          setTimeout(() => {
            focusBorder.style.backgroundColor = 'var(--border-light)';
          }, 1500);
        }
        return false;
      }

      // Basic email validation
      if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.value.trim())) {
          const inputGroup = currentActive.querySelector('.input-group');
          inputGroup.classList.remove('error-shake');
          void inputGroup.offsetWidth;
          inputGroup.classList.add('error-shake');
          return false;
        }
      }
    }
    return true;
  };

  const saveCurrentData = () => {
    const currentActive = screens[currentScreen];

    // Save text input data
    const input = currentActive.querySelector('input, textarea');
    if (input) {
      const id = input.id.replace('Input', '');
      formData[id] = input.value.trim();
    }
  };

  window.nextScreen = () => {
    if (!validateCurrentScreen()) return;
    saveCurrentData();

    // If we are on the very last question (before Success screen)
    if (currentScreen === totalScreens - 2) {
      const submitBtn = screens[currentScreen].querySelector('.finish-btn');
      let originalContent = '';
      if (submitBtn) {
        originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Submitting...</span>';
        submitBtn.style.pointerEvents = 'none';
      }

      // --- PASTE YOUR GOOGLE SCRIPT WEB APP URL HERE ---
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPQGTc2uv-iSvN2cxKmKeUnxcdW-y4dPV4MKFLS2BZ9UQnLcU0Y_MYIHDLST89-3Qw/exec';

      if (!GOOGLE_SCRIPT_URL) {
        console.warn('Form data ready, but no GOOGLE_SCRIPT_URL provided:', formData);
        console.warn('Please follow the walkthrough to add your Google Script URL.');
        // Move to success screen anyway for demo
        currentScreen++;
        showScreen(currentScreen);
        return;
      }

      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
        .then(response => {
          // Progress to success screen on success
          currentScreen++;
          showScreen(currentScreen);
        })
        .catch(error => {
          console.error('Error submitting form:', error);
          alert('There was a problem submitting the form. Please try again.');
          if (submitBtn) {
            submitBtn.innerHTML = originalContent;
            submitBtn.style.pointerEvents = 'auto';
          }
        });

      return; // Wait for fetch
    }

    // Normal progression for other question screens
    if (currentScreen < totalScreens - 2) {
      currentScreen++;
      showScreen(currentScreen);
    }
  };

  // Setup options selection
  const optionCards = document.querySelectorAll('.option-card');
  optionCards.forEach(card => {
    card.addEventListener('click', function () {
      const screen = this.closest('.screen');
      screen.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');

      formData.interest = this.querySelector('span').textContent;

      // Auto-advance
      setTimeout(() => {
        nextScreen();
      }, 350);
    });
  });

  // Enter key support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const activeScreen = screens[currentScreen];
      const activeElement = document.activeElement;

      // Prevent standard submission if in text area (allow newlines)
      if (activeElement && activeElement.tagName.toLowerCase() === 'textarea' && !e.shiftKey) {
        e.preventDefault();
        nextScreen();
      } else if (activeElement && activeElement.tagName.toLowerCase() !== 'textarea') {
        e.preventDefault();
        nextScreen();
      }
    }
  });

  // Initialize
  showScreen(0);
});
