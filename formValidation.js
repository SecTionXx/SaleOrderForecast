// formValidation.js - Provides validation rules for data entry forms

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
    allowedValues: ['Lead', 'Proposal Sent', 'Negotiation', 'Verbal Agreement', 'Closed Won', 'Closed Lost'],
    errorMessages: {
      required: 'Deal stage is required',
      allowedValues: 'Invalid deal stage selected'
    }
  },
  salesRep: {
    required: true,
    errorMessages: {
      required: 'Sales representative is required'
    }
  },
  totalValue: {
    required: true,
    min: 0,
    max: 1000000000, // 1 billion
    pattern: /^\d+(\.\d{1,2})?$/,
    errorMessages: {
      required: 'Total value is required',
      min: 'Total value cannot be negative',
      max: 'Total value exceeds maximum allowed (1 billion)',
      pattern: 'Total value must be a number with up to 2 decimal places'
    }
  },
  probabilityPercent: {
    required: true,
    min: 0,
    max: 100,
    pattern: /^\d+(\.\d{1,2})?$/,
    errorMessages: {
      required: 'Probability percentage is required',
      min: 'Probability cannot be negative',
      max: 'Probability cannot exceed 100%',
      pattern: 'Probability must be a number with up to 2 decimal places'
    }
  },
  expectedCloseDate: {
    required: true,
    futureDate: true,
    errorMessages: {
      required: 'Expected close date is required',
      futureDate: 'Expected close date must be in the future'
    }
  },
  notes: {
    maxLength: 500,
    errorMessages: {
      maxLength: 'Notes cannot exceed 500 characters'
    }
  },
  actualCloseDate: {
    conditionalRequired: {
      dependsOn: 'dealStage',
      requiredWhen: ['Closed Won', 'Closed Lost']
    },
    errorMessages: {
      conditionalRequired: 'Actual close date is required for closed deals'
    }
  },
  closedReason: {
    conditionalRequired: {
      dependsOn: 'dealStage',
      requiredWhen: ['Closed Lost']
    },
    maxLength: 200,
    errorMessages: {
      conditionalRequired: 'Reason is required for lost deals',
      maxLength: 'Reason cannot exceed 200 characters'
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
  const fieldName = field.name;
  const fieldValue = field.value.trim();
  const rules = validationRules[fieldName];
  
  // If no rules defined for this field, consider it valid
  if (!rules) {
    return { isValid: true };
  }
  
  // Check required rule
  if (rules.required && !fieldValue) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.required
    };
  }
  
  // Check conditional required rule
  if (rules.conditionalRequired && !fieldValue) {
    const { dependsOn, requiredWhen } = rules.conditionalRequired;
    const dependsOnValue = formData[dependsOn];
    
    if (requiredWhen.includes(dependsOnValue)) {
      return {
        isValid: false,
        errorMessage: rules.errorMessages.conditionalRequired
      };
    }
  }
  
  // Skip other validations if field is empty and not required
  if (!fieldValue) {
    return { isValid: true };
  }
  
  // Check min length
  if (rules.minLength && fieldValue.length < rules.minLength) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.minLength
    };
  }
  
  // Check max length
  if (rules.maxLength && fieldValue.length > rules.maxLength) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.maxLength
    };
  }
  
  // Check pattern
  if (rules.pattern && !rules.pattern.test(fieldValue)) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.pattern
    };
  }
  
  // Check allowed values
  if (rules.allowedValues && !rules.allowedValues.includes(fieldValue)) {
    return {
      isValid: false,
      errorMessage: rules.errorMessages.allowedValues
    };
  }
  
  // Check min value for numeric fields
  if (rules.min !== undefined) {
    const numValue = parseFloat(fieldValue);
    if (isNaN(numValue) || numValue < rules.min) {
      return {
        isValid: false,
        errorMessage: rules.errorMessages.min
      };
    }
  }
  
  // Check max value for numeric fields
  if (rules.max !== undefined) {
    const numValue = parseFloat(fieldValue);
    if (isNaN(numValue) || numValue > rules.max) {
      return {
        isValid: false,
        errorMessage: rules.errorMessages.max
      };
    }
  }
  
  // Check future date
  if (rules.futureDate) {
    const dateValue = new Date(fieldValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison
    
    if (isNaN(dateValue.getTime()) || dateValue < today) {
      return {
        isValid: false,
        errorMessage: rules.errorMessages.futureDate
      };
    }
  }
  
  // If we got here, the field is valid
  return { isValid: true };
}

/**
 * Validate an entire form
 * @param {HTMLFormElement} form - The form to validate
 * @returns {Object} - Validation result with isValid and errors properties
 */
function validateForm(form) {
  const formData = {};
  const formFields = Array.from(form.elements).filter(el => el.name);
  const errors = {};
  let isValid = true;
  
  // First pass: collect all form data for conditional validation
  formFields.forEach(field => {
    formData[field.name] = field.value.trim();
  });
  
  // Second pass: validate each field
  formFields.forEach(field => {
    const result = validateField(field, formData);
    
    if (!result.isValid) {
      errors[field.name] = result.errorMessage;
      isValid = false;
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
  // First clear any existing error messages
  clearValidationErrors(form);
  
  // Display new error messages
  Object.entries(errors).forEach(([fieldName, errorMessage]) => {
    const field = form.elements[fieldName];
    if (!field) return;
    
    // Add error class to the field
    field.classList.add('is-invalid');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback';
    errorElement.textContent = errorMessage;
    
    // Add error message after the field
    const formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.appendChild(errorElement);
    } else {
      // If no form-group, insert after the field itself
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
  });
}

/**
 * Clear all validation errors from a form
 * @param {HTMLFormElement} form - The form to clear errors from
 */
function clearValidationErrors(form) {
  // Remove error classes from all fields
  Array.from(form.elements).forEach(field => {
    field.classList.remove('is-invalid');
  });
  
  // Remove all error messages
  const errorMessages = form.querySelectorAll('.invalid-feedback');
  errorMessages.forEach(el => el.remove());
}

/**
 * Initialize form validation for a specific form
 * @param {string} formId - The ID of the form to initialize validation for
 * @param {Function} onSubmit - Callback function to call when form is valid and submitted
 */
function initializeFormValidation(formId, onSubmit) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  // Add submit event listener
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Validate the form
    const { isValid, errors } = validateForm(form);
    
    if (isValid) {
      // Form is valid, call the onSubmit callback
      onSubmit(form);
    } else {
      // Form is invalid, display errors
      displayValidationErrors(form, errors);
    }
  });
  
  // Add input event listeners to clear errors when user corrects them
  Array.from(form.elements).forEach(field => {
    if (!field.name) return;
    
    field.addEventListener('input', function() {
      // Remove error class and message when user starts typing
      field.classList.remove('is-invalid');
      const formGroup = field.closest('.form-group');
      if (formGroup) {
        const errorMessage = formGroup.querySelector('.invalid-feedback');
        if (errorMessage) {
          errorMessage.remove();
        }
      }
    });
  });
}

/**
 * Initialize live validation for a specific field
 * @param {HTMLElement} field - The field to initialize live validation for
 */
function initializeLiveValidation(field) {
  if (!field.name || !validationRules[field.name]) return;
  
  // Add blur event listener for validation
  field.addEventListener('blur', function() {
    const form = field.form;
    const formData = {};
    
    // Collect form data for conditional validation
    Array.from(form.elements).forEach(el => {
      if (el.name) {
        formData[el.name] = el.value.trim();
      }
    });
    
    // Validate this field
    const result = validateField(field, formData);
    
    if (!result.isValid) {
      // Show error
      field.classList.add('is-invalid');
      
      // Create error message element if it doesn't exist
      let errorElement = field.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback';
        const formGroup = field.closest('.form-group');
        if (formGroup) {
          formGroup.appendChild(errorElement);
        } else {
          field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
      }
      
      // Set error message
      errorElement.textContent = result.errorMessage;
    } else {
      // Clear error
      field.classList.remove('is-invalid');
      const errorElement = field.nextElementSibling;
      if (errorElement && errorElement.classList.contains('invalid-feedback')) {
        errorElement.remove();
      }
    }
  });
}

/**
 * Initialize live validation for all fields in a form
 * @param {string} formId - The ID of the form to initialize live validation for
 */
function initializeLiveFormValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  // Initialize live validation for each field
  Array.from(form.elements).forEach(field => {
    if (field.name) {
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
  initializeLiveValidation,
  initializeLiveFormValidation
};
