/**
 * formValidation.js - Provides validation rules for data entry forms
 */

/**
 * Validation rules for deal form fields
 * @type {Object}
 */
const validationRules = {
  customerName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[A-Za-z0-9\s\-&.,'"()]+$/,
    errorMessages: {
      required: 'Customer name is required',
      minLength: 'Customer name must be at least 2 characters',
      maxLength: 'Customer name cannot exceed 100 characters',
      pattern: 'Customer name contains invalid characters'
    }
  },
  projectName: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[A-Za-z0-9\s\-&.,'"()]+$/,
    errorMessages: {
      required: 'Project name is required',
      minLength: 'Project name must be at least 2 characters',
      maxLength: 'Project name cannot exceed 100 characters',
      pattern: 'Project name contains invalid characters'
    }
  },
  dealStage: {
    required: true,
    errorMessages: {
      required: 'Deal stage is required'
    }
  },
  dealValue: {
    required: true,
    min: 0,
    pattern: /^\d+(\.\d{1,2})?$/,
    errorMessages: {
      required: 'Deal value is required',
      min: 'Deal value must be a positive number',
      pattern: 'Deal value must be a valid number'
    }
  },
  probability: {
    required: true,
    min: 0,
    max: 100,
    pattern: /^\d+(\.\d{1,2})?$/,
    errorMessages: {
      required: 'Probability is required',
      min: 'Probability must be between 0 and 100',
      max: 'Probability must be between 0 and 100',
      pattern: 'Probability must be a valid number'
    }
  },
  closeDate: {
    required: true,
    future: true,
    errorMessages: {
      required: 'Close date is required',
      future: 'Close date must be in the future'
    }
  },
  salesRep: {
    required: true,
    errorMessages: {
      required: 'Sales rep is required'
    }
  },
  lossReason: {
    requiredIf: (formData) => formData.dealStage === 'closed-lost',
    errorMessages: {
      requiredIf: 'Loss reason is required for lost deals'
    }
  },
  notes: {
    maxLength: 1000,
    errorMessages: {
      maxLength: 'Notes cannot exceed 1000 characters'
    }
  }
};

/**
 * Validate a form field against defined rules
 * @param {HTMLElement} field - The form field to validate
 * @param {Object} formData - All form data for conditional validation
 * @returns {Object} - Validation result with isValid and errorMessage properties
 */
function validateField(field, formData = {}) {
  const name = field.name;
  const value = field.value;
  const rules = validationRules[name];
  
  // If no rules defined for this field, consider it valid
  if (!rules) {
    return { isValid: true };
  }
  
  // Check required
  if (rules.required && !value.trim()) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.required
    };
  }
  
  // Check requiredIf (conditional required)
  if (rules.requiredIf && rules.requiredIf(formData) && !value.trim()) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.requiredIf
    };
  }
  
  // Skip other validations if field is empty and not required
  if (!value.trim()) {
    return { isValid: true };
  }
  
  // Check minLength
  if (rules.minLength && value.length < rules.minLength) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.minLength
    };
  }
  
  // Check maxLength
  if (rules.maxLength && value.length > rules.maxLength) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.maxLength
    };
  }
  
  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.pattern
    };
  }
  
  // Check min value (for number inputs)
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.min
    };
  }
  
  // Check max value (for number inputs)
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.max
    };
  }
  
  // Check future date (for date inputs)
  if (rules.future && new Date(value) <= new Date()) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.future
    };
  }
  
  // All validations passed
  return { isValid: true };
}

/**
 * Validate an entire form
 * @param {HTMLFormElement} form - The form to validate
 * @returns {Object} - Validation result with isValid and errors properties
 */
function validateForm(form) {
  const formData = {};
  const errors = {};
  let isValid = true;
  
  // Collect all form data first for conditional validation
  Array.from(form.elements).forEach(field => {
    if (field.name) {
      formData[field.name] = field.value;
    }
  });
  
  // Validate each field
  Array.from(form.elements).forEach(field => {
    if (field.name) {
      const result = validateField(field, formData);
      
      if (!result.isValid) {
        errors[field.name] = result.errorMessage;
        isValid = false;
      }
    }
  });
  
  return { isValid, errors };
}

/**
 * Display validation errors on the form
 * @param {HTMLFormElement} form - The form containing the fields
 * @param {Object} errors - Object mapping field names to error messages
 */
function displayValidationErrors(form, errors) {
  // Clear existing errors first
  clearValidationErrors(form);
  
  // Display new errors
  Object.entries(errors).forEach(([fieldName, errorMessage]) => {
    const field = form.elements[fieldName];
    
    if (field) {
      // Add error class to field
      field.classList.add('error');
      
      // Find or create error message element
      let errorElement = form.querySelector(`.validation-message[data-for="${fieldName}"]`);
      
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'validation-message';
        errorElement.dataset.for = fieldName;
        field.parentNode.appendChild(errorElement);
      }
      
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
    }
  });
}

/**
 * Clear all validation errors from a form
 * @param {HTMLFormElement} form - The form to clear errors from
 */
function clearValidationErrors(form) {
  // Remove error class from all fields
  Array.from(form.elements).forEach(field => {
    if (field.classList) {
      field.classList.remove('error');
    }
  });
  
  // Hide all error messages
  const errorMessages = form.querySelectorAll('.validation-message');
  errorMessages.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });
}

/**
 * Initialize form validation for a specific form
 * @param {string} formId - The ID of the form to initialize validation for
 * @param {Function} onSubmit - Callback function to call when form is valid and submitted
 */
function initializeFormValidation(formId, onSubmit) {
  const form = document.getElementById(formId);
  
  if (!form) {
    console.error(`Form with ID "${formId}" not found`);
    return;
  }
  
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Validate the form
    const { isValid, errors } = validateForm(form);
    
    if (isValid) {
      // Form is valid, call the onSubmit callback
      if (typeof onSubmit === 'function') {
        onSubmit(form);
      }
    } else {
      // Form is invalid, display errors
      displayValidationErrors(form, errors);
    }
  });
  
  // Initialize live validation for all fields
  initializeLiveFormValidation(formId);
}

/**
 * Initialize live validation for a specific field
 * @param {HTMLElement} field - The field to initialize live validation for
 */
function initializeLiveValidation(field) {
  const validateOnEvents = ['blur', 'change'];
  
  validateOnEvents.forEach(eventType => {
    field.addEventListener(eventType, function() {
      // Get all form data for conditional validation
      const form = field.form;
      const formData = {};
      
      Array.from(form.elements).forEach(formField => {
        if (formField.name) {
          formData[formField.name] = formField.value;
        }
      });
      
      // Validate this field
      const result = validateField(field, formData);
      
      // Find or create error message element
      let errorElement = form.querySelector(`.validation-message[data-for="${field.name}"]`);
      
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'validation-message';
        errorElement.dataset.for = field.name;
        field.parentNode.appendChild(errorElement);
      }
      
      // Update field and error message
      if (result.isValid) {
        field.classList.remove('error');
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      } else {
        field.classList.add('error');
        errorElement.textContent = result.errorMessage;
        errorElement.style.display = 'block';
      }
    });
  });
}

/**
 * Initialize live validation for all fields in a form
 * @param {string} formId - The ID of the form to initialize live validation for
 */
function initializeLiveFormValidation(formId) {
  const form = document.getElementById(formId);
  
  if (!form) {
    console.error(`Form with ID "${formId}" not found`);
    return;
  }
  
  // Initialize live validation for each field
  Array.from(form.elements).forEach(field => {
    if (field.name && field.type !== 'submit' && field.type !== 'button') {
      initializeLiveValidation(field);
    }
  });
}

// Export functions
export {
  validateField,
  validateForm,
  displayValidationErrors,
  clearValidationErrors,
  initializeFormValidation,
  initializeLiveFormValidation
};
