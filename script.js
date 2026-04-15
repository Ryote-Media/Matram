/* script.js */
document.addEventListener('DOMContentLoaded', () => {
  let currentScreen = 0;
  const screens = document.querySelectorAll('.screen');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const totalScreens = screens.length;
  // Subtracting Welcome(start) and Success(end) screens from total form steps
  const totalSteps = totalScreens - 2;

  const formData = {};

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

        // Auto-focus first visible input after transition
        const input = screen.querySelector('input:not([type="hidden"]), textarea');
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
    let isValid = true;
    
    // Check all inputs that are required and visible
    const inputs = currentActive.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      // If inside a conditional wrap that is not shown, skip validation
      const wrap = input.closest('.conditional-wrap');
      if (wrap && !wrap.classList.contains('show')) return;

      if (input.hasAttribute('required')) {
        if (!input.value.trim()) {
          const inputGroup = input.closest('.input-group');
          if (inputGroup) {
            inputGroup.classList.remove('error-shake');
            void inputGroup.offsetWidth;
            inputGroup.classList.add('error-shake');

            const focusBorder = inputGroup.querySelector('.focus-border');
            if (focusBorder) {
              focusBorder.style.backgroundColor = '#ef4444';
              setTimeout(() => {
                focusBorder.style.backgroundColor = 'var(--border-light)';
              }, 1500);
            }
          }
          isValid = false;
        }

        // Basic email validation
        if (input.type === 'email' && input.value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.value.trim())) {
            isValid = false;
          }
        }
      }
    });
    
    return isValid;
  };

  const saveCurrentData = () => {
    const currentActive = screens[currentScreen];

    // Save text input data
    const inputs = currentActive.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      const wrap = input.closest('.conditional-wrap');
      if (wrap && !wrap.classList.contains('show')) return; // Skip hidden conditionals

      const id = input.id.replace('Input', '');
      formData[id] = input.value.trim();
    });
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
      const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4J0xgGfFv1-DsU2-dvzXK4w8Et63c0oAMo4IBH4nhZJn_2xMk6kyGAaLLo3AK5Gq-/exec';

      if (!GOOGLE_SCRIPT_URL) {
        console.warn('Form data ready, but no GOOGLE_SCRIPT_URL provided:', formData);
        // Move to success screen
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

    // Normal progression
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
      const grid = this.closest('.options-grid');
      const field = grid.dataset.field; // "gender", "occupation", etc.

      grid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');

      const val = this.dataset.value;
      if (field) {
        formData[field] = val;
      }

      // Handle conditional reveals without auto-advancing
      if (field === 'occupation') {
        const studentWrap = document.getElementById('studentCourseWrap');
        if (val === 'Student') {
          studentWrap.classList.add('show');
          const courseInput = document.getElementById('courseInput');
          courseInput.setAttribute('required', 'true');
          setTimeout(() => courseInput.focus(), 300);
          return;
        } else {
          studentWrap.classList.remove('show');
          document.getElementById('courseInput').removeAttribute('required');
        }
      }

      if (field === 'health_issues') {
        const healthWrap = document.getElementById('healthIssueWrap');
        if (val === 'Yes') {
          healthWrap.classList.add('show');
          const healthInput = document.getElementById('healthDetailsInput');
          healthInput.setAttribute('required', 'true');
          setTimeout(() => healthInput.focus(), 300);
          return;
        } else {
          healthWrap.classList.remove('show');
          document.getElementById('healthDetailsInput').removeAttribute('required');
        }
      }

      if (field === 'charity') {
        const charityWrap = document.getElementById('charitySubmitWrap');
        charityWrap.classList.add('show');
        return; // wait for manual submit to avoid accidental submission
      }

      // Auto-advance for standard option selects
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
