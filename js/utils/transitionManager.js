/**
 * transitionManager.js - Loading States and Transitions Manager
 * Provides utilities for managing loading states and smooth transitions
 * between different sections and states of the application
 */

/**
 * Manages loading states for elements
 * @param {Object} options - Configuration options
 * @returns {Object} - Loading state manager methods
 */
export function createLoadingManager(options = {}) {
  const {
    defaultLoadingMessage = 'Loading...',
    defaultErrorMessage = 'An error occurred. Please try again.',
    defaultSuccessMessage = 'Operation completed successfully.',
    loadingClass = 'is-loading',
    errorClass = 'has-error',
    successClass = 'is-success',
    animationDuration = 300,
    autoHideDelay = 3000
  } = options;
  
  // Track loading states for elements
  const loadingStates = new Map();
  
  /**
   * Set loading state for an element
   * @param {string|HTMLElement} element - Element or selector
   * @param {boolean} isLoading - Whether element is loading
   * @param {string} message - Optional loading message
   * @returns {Object} - Loading state control methods
   */
  function setLoading(element, isLoading = true, message = defaultLoadingMessage) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    
    if (!el) {
      console.error('Element not found:', element);
      return null;
    }
    
    // Get or create loading state for element
    let state = loadingStates.get(el);
    
    if (!state) {
      // Create loading overlay
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">${message}</div>
        </div>
      `;
      
      // Create error message element
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.style.display = 'none';
      
      // Create success message element
      const successEl = document.createElement('div');
      successEl.className = 'success-message';
      successEl.style.display = 'none';
      
      // Add elements to DOM
      el.style.position = 'relative';
      el.appendChild(overlay);
      el.appendChild(errorEl);
      el.appendChild(successEl);
      
      // Create state
      state = {
        overlay,
        errorEl,
        successEl,
        isLoading: false,
        hasError: false,
        isSuccess: false,
        timeoutId: null
      };
      
      loadingStates.set(el, state);
    }
    
    // Update loading state
    state.isLoading = isLoading;
    
    // Update UI
    if (isLoading) {
      // Show loading overlay
      el.classList.add(loadingClass);
      state.overlay.style.display = 'flex';
      state.overlay.querySelector('.loading-message').textContent = message;
      
      // Hide error and success messages
      state.errorEl.style.display = 'none';
      state.successEl.style.display = 'none';
      el.classList.remove(errorClass, successClass);
      
      // Clear any existing timeout
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
      }
    } else {
      // Hide loading overlay
      el.classList.remove(loadingClass);
      state.overlay.style.display = 'none';
    }
    
    // Return control methods
    return {
      setMessage: (newMessage) => {
        state.overlay.querySelector('.loading-message').textContent = newMessage;
      },
      
      setError: (errorMessage = defaultErrorMessage, autoHide = true) => {
        // Update state
        state.isLoading = false;
        state.hasError = true;
        state.isSuccess = false;
        
        // Update UI
        el.classList.remove(loadingClass, successClass);
        el.classList.add(errorClass);
        state.overlay.style.display = 'none';
        
        state.errorEl.textContent = errorMessage;
        state.errorEl.style.display = 'block';
        state.successEl.style.display = 'none';
        
        // Auto-hide error message
        if (autoHide) {
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }
          
          state.timeoutId = setTimeout(() => {
            state.errorEl.style.display = 'none';
            el.classList.remove(errorClass);
            state.hasError = false;
            state.timeoutId = null;
          }, autoHideDelay);
        }
      },
      
      setSuccess: (successMessage = defaultSuccessMessage, autoHide = true) => {
        // Update state
        state.isLoading = false;
        state.hasError = false;
        state.isSuccess = true;
        
        // Update UI
        el.classList.remove(loadingClass, errorClass);
        el.classList.add(successClass);
        state.overlay.style.display = 'none';
        
        state.successEl.textContent = successMessage;
        state.successEl.style.display = 'block';
        state.errorEl.style.display = 'none';
        
        // Auto-hide success message
        if (autoHide) {
          if (state.timeoutId) {
            clearTimeout(state.timeoutId);
          }
          
          state.timeoutId = setTimeout(() => {
            state.successEl.style.display = 'none';
            el.classList.remove(successClass);
            state.isSuccess = false;
            state.timeoutId = null;
          }, autoHideDelay);
        }
      },
      
      reset: () => {
        // Update state
        state.isLoading = false;
        state.hasError = false;
        state.isSuccess = false;
        
        // Update UI
        el.classList.remove(loadingClass, errorClass, successClass);
        state.overlay.style.display = 'none';
        state.errorEl.style.display = 'none';
        state.successEl.style.display = 'none';
        
        // Clear timeout
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
          state.timeoutId = null;
        }
      },
      
      destroy: () => {
        // Remove elements
        el.removeChild(state.overlay);
        el.removeChild(state.errorEl);
        el.removeChild(state.successEl);
        
        // Remove classes
        el.classList.remove(loadingClass, errorClass, successClass);
        
        // Clear timeout
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
        }
        
        // Remove from map
        loadingStates.delete(el);
      }
    };
  }
  
  // Return public API
  return {
    setLoading,
    
    showError: (element, message = defaultErrorMessage, autoHide = true) => {
      const controller = setLoading(element, false);
      if (controller) {
        controller.setError(message, autoHide);
      }
      return controller;
    },
    
    showSuccess: (element, message = defaultSuccessMessage, autoHide = true) => {
      const controller = setLoading(element, false);
      if (controller) {
        controller.setSuccess(message, autoHide);
      }
      return controller;
    },
    
    reset: (element) => {
      const el = typeof element === 'string' ? document.querySelector(element) : element;
      const state = loadingStates.get(el);
      
      if (state) {
        el.classList.remove(loadingClass, errorClass, successClass);
        state.overlay.style.display = 'none';
        state.errorEl.style.display = 'none';
        state.successEl.style.display = 'none';
        
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
          state.timeoutId = null;
        }
        
        state.isLoading = false;
        state.hasError = false;
        state.isSuccess = false;
      }
    },
    
    destroy: (element) => {
      const el = typeof element === 'string' ? document.querySelector(element) : element;
      const state = loadingStates.get(el);
      
      if (state) {
        el.removeChild(state.overlay);
        el.removeChild(state.errorEl);
        el.removeChild(state.successEl);
        
        el.classList.remove(loadingClass, errorClass, successClass);
        
        if (state.timeoutId) {
          clearTimeout(state.timeoutId);
        }
        
        loadingStates.delete(el);
      }
    }
  };
}

/**
 * Manages page transitions
 * @param {Object} options - Configuration options
 * @returns {Object} - Transition manager methods
 */
export function createTransitionManager(options = {}) {
  const {
    containerSelector = '#app',
    pageClass = 'page',
    activePageClass = 'active',
    transitionDuration = 300,
    defaultTransition = 'fade',
    transitions = {
      fade: {
        enter: (element, done) => {
          element.style.opacity = '0';
          element.style.display = 'block';
          
          setTimeout(() => {
            element.style.opacity = '1';
            setTimeout(done, transitionDuration);
          }, 50);
        },
        leave: (element, done) => {
          element.style.opacity = '0';
          
          setTimeout(() => {
            element.style.display = 'none';
            done();
          }, transitionDuration);
        }
      },
      slide: {
        enter: (element, done) => {
          element.style.transform = 'translateX(100%)';
          element.style.display = 'block';
          
          setTimeout(() => {
            element.style.transform = 'translateX(0)';
            setTimeout(done, transitionDuration);
          }, 50);
        },
        leave: (element, done) => {
          element.style.transform = 'translateX(-100%)';
          
          setTimeout(() => {
            element.style.display = 'none';
            done();
          }, transitionDuration);
        }
      },
      zoom: {
        enter: (element, done) => {
          element.style.transform = 'scale(0.8)';
          element.style.opacity = '0';
          element.style.display = 'block';
          
          setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
            setTimeout(done, transitionDuration);
          }, 50);
        },
        leave: (element, done) => {
          element.style.transform = 'scale(1.2)';
          element.style.opacity = '0';
          
          setTimeout(() => {
            element.style.display = 'none';
            done();
          }, transitionDuration);
        }
      }
    }
  } = options;
  
  // Get container element
  const container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Container element not found:', containerSelector);
    return null;
  }
  
  // Track current page
  let currentPage = null;
  
  // Initialize pages
  const pages = Array.from(container.querySelectorAll(`.${pageClass}`));
  
  pages.forEach(page => {
    page.style.display = 'none';
    
    // Set transition styles
    page.style.transition = `opacity ${transitionDuration}ms, transform ${transitionDuration}ms`;
  });
  
  // Show initial page if specified
  const initialPage = pages.find(page => page.classList.contains(activePageClass));
  
  if (initialPage) {
    initialPage.style.display = 'block';
    currentPage = initialPage;
  }
  
  /**
   * Navigate to a page
   * @param {string|HTMLElement} page - Page element or selector
   * @param {string} transition - Transition name
   * @returns {Promise} - Resolves when transition is complete
   */
  function navigateTo(page, transition = defaultTransition) {
    return new Promise((resolve) => {
      // Get page element
      const pageEl = typeof page === 'string' ? document.querySelector(page) : page;
      
      if (!pageEl) {
        console.error('Page element not found:', page);
        resolve(false);
        return;
      }
      
      // If already on this page, do nothing
      if (pageEl === currentPage) {
        resolve(true);
        return;
      }
      
      // Get transition
      const trans = transitions[transition] || transitions[defaultTransition];
      
      // Leave current page
      if (currentPage) {
        currentPage.classList.remove(activePageClass);
        
        trans.leave(currentPage, () => {
          // Enter new page
          pageEl.classList.add(activePageClass);
          
          trans.enter(pageEl, () => {
            currentPage = pageEl;
            resolve(true);
          });
        });
      } else {
        // No current page, just enter new page
        pageEl.classList.add(activePageClass);
        
        trans.enter(pageEl, () => {
          currentPage = pageEl;
          resolve(true);
        });
      }
    });
  }
  
  /**
   * Add a new transition
   * @param {string} name - Transition name
   * @param {Object} transition - Transition object with enter and leave functions
   */
  function addTransition(name, transition) {
    if (typeof transition.enter !== 'function' || typeof transition.leave !== 'function') {
      console.error('Invalid transition:', name);
      return;
    }
    
    transitions[name] = transition;
  }
  
  // Return public API
  return {
    navigateTo,
    addTransition,
    
    getCurrentPage: () => currentPage,
    
    getPages: () => pages,
    
    registerPage: (page) => {
      const pageEl = typeof page === 'string' ? document.querySelector(page) : page;
      
      if (!pageEl) {
        console.error('Page element not found:', page);
        return;
      }
      
      if (!pages.includes(pageEl)) {
        pageEl.style.display = 'none';
        pageEl.style.transition = `opacity ${transitionDuration}ms, transform ${transitionDuration}ms`;
        pages.push(pageEl);
      }
    }
  };
}

/**
 * Creates a section transition controller
 * @param {string|HTMLElement} container - Container element or selector
 * @param {Object} options - Configuration options
 * @returns {Object} - Section transition controller
 */
export function createSectionTransition(container, options = {}) {
  const {
    sectionSelector = '.section',
    activeClass = 'active',
    transitionDuration = 300,
    defaultTransition = 'fade',
    onBeforeTransition = null,
    onAfterTransition = null
  } = options;
  
  // Get container element
  const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
  
  if (!containerEl) {
    console.error('Container element not found:', container);
    return null;
  }
  
  // Get sections
  const sections = Array.from(containerEl.querySelectorAll(sectionSelector));
  
  // Track current section
  let currentSection = sections.find(section => section.classList.contains(activeClass)) || null;
  
  // Initialize sections
  sections.forEach(section => {
    if (section !== currentSection) {
      section.style.display = 'none';
    }
    
    // Set transition styles
    section.style.transition = `opacity ${transitionDuration}ms, transform ${transitionDuration}ms`;
  });
  
  // Transitions
  const transitions = {
    fade: {
      enter: (element, done) => {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
          element.style.opacity = '1';
          setTimeout(done, transitionDuration);
        }, 50);
      },
      leave: (element, done) => {
        element.style.opacity = '0';
        
        setTimeout(() => {
          element.style.display = 'none';
          done();
        }, transitionDuration);
      }
    },
    slide: {
      enter: (element, done) => {
        element.style.transform = 'translateX(100%)';
        element.style.display = 'block';
        
        setTimeout(() => {
          element.style.transform = 'translateX(0)';
          setTimeout(done, transitionDuration);
        }, 50);
      },
      leave: (element, done) => {
        element.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
          element.style.display = 'none';
          done();
        }, transitionDuration);
      }
    },
    slideUp: {
      enter: (element, done) => {
        element.style.transform = 'translateY(30px)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        setTimeout(() => {
          element.style.transform = 'translateY(0)';
          element.style.opacity = '1';
          setTimeout(done, transitionDuration);
        }, 50);
      },
      leave: (element, done) => {
        element.style.transform = 'translateY(-30px)';
        element.style.opacity = '0';
        
        setTimeout(() => {
          element.style.display = 'none';
          done();
        }, transitionDuration);
      }
    }
  };
  
  /**
   * Show a section
   * @param {string|HTMLElement} section - Section element or selector
   * @param {string} transition - Transition name
   * @returns {Promise} - Resolves when transition is complete
   */
  function showSection(section, transition = defaultTransition) {
    return new Promise((resolve) => {
      // Get section element
      const sectionEl = typeof section === 'string' 
        ? containerEl.querySelector(section) 
        : section;
      
      if (!sectionEl) {
        console.error('Section element not found:', section);
        resolve(false);
        return;
      }
      
      // If already showing this section, do nothing
      if (sectionEl === currentSection) {
        resolve(true);
        return;
      }
      
      // Get transition
      const trans = transitions[transition] || transitions[defaultTransition];
      
      // Call before transition hook
      if (onBeforeTransition) {
        onBeforeTransition(currentSection, sectionEl);
      }
      
      // Leave current section
      if (currentSection) {
        currentSection.classList.remove(activeClass);
        
        trans.leave(currentSection, () => {
          // Enter new section
          sectionEl.classList.add(activeClass);
          
          trans.enter(sectionEl, () => {
            currentSection = sectionEl;
            
            // Call after transition hook
            if (onAfterTransition) {
              onAfterTransition(sectionEl);
            }
            
            resolve(true);
          });
        });
      } else {
        // No current section, just enter new section
        sectionEl.classList.add(activeClass);
        
        trans.enter(sectionEl, () => {
          currentSection = sectionEl;
          
          // Call after transition hook
          if (onAfterTransition) {
            onAfterTransition(sectionEl);
          }
          
          resolve(true);
        });
      }
    });
  }
  
  // Return public API
  return {
    showSection,
    
    getCurrentSection: () => currentSection,
    
    getSections: () => sections,
    
    addTransition: (name, transition) => {
      if (typeof transition.enter !== 'function' || typeof transition.leave !== 'function') {
        console.error('Invalid transition:', name);
        return;
      }
      
      transitions[name] = transition;
    }
  };
}
