/**
 * Unit tests for validator.js utility
 */

import {
  validateValue,
  validateObject,
  isFormValid,
  required,
  minLength,
  maxLength,
  pattern,
  email,
  number,
  minValue,
  maxValue,
  date,
  dateRange,
  equals,
  custom,
  VALIDATION_PATTERNS
} from '../../js/utils/validator';

describe('Validator Utility', () => {
  describe('Validation Rules', () => {
    test('required rule should validate non-empty values', () => {
      const rule = required('Field is required');
      
      // Valid values
      expect(validateValue('test', [rule])).toBeNull();
      expect(validateValue(0, [rule])).toBeNull();
      expect(validateValue(false, [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('', [rule])).toBe('Field is required');
      expect(validateValue(null, [rule])).toBe('Field is required');
      expect(validateValue(undefined, [rule])).toBe('Field is required');
    });
    
    test('minLength rule should validate string length', () => {
      const rule = minLength(3, 'Must be at least 3 characters');
      
      // Valid values
      expect(validateValue('test', [rule])).toBeNull();
      expect(validateValue('123', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('ab', [rule])).toBe('Must be at least 3 characters');
      expect(validateValue('', [rule])).toBeNull(); // Empty string passes if not required
    });
    
    test('maxLength rule should validate string length', () => {
      const rule = maxLength(5, 'Must be no more than 5 characters');
      
      // Valid values
      expect(validateValue('test', [rule])).toBeNull();
      expect(validateValue('12345', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('123456', [rule])).toBe('Must be no more than 5 characters');
    });
    
    test('pattern rule should validate against regex', () => {
      const rule = pattern(VALIDATION_PATTERNS.EMAIL, 'Invalid email format');
      
      // Valid values
      expect(validateValue('test@example.com', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('invalid-email', [rule])).toBe('Invalid email format');
    });
    
    test('email rule should validate email format', () => {
      const rule = email('Invalid email');
      
      // Valid values
      expect(validateValue('test@example.com', [rule])).toBeNull();
      expect(validateValue('user.name+tag@domain.co.uk', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('invalid-email', [rule])).toBe('Invalid email');
      expect(validateValue('test@', [rule])).toBe('Invalid email');
    });
    
    test('number rule should validate numeric values', () => {
      const rule = number('Must be a number');
      
      // Valid values
      expect(validateValue(123, [rule])).toBeNull();
      expect(validateValue('123', [rule])).toBeNull();
      expect(validateValue(0, [rule])).toBeNull();
      expect(validateValue(-10, [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('abc', [rule])).toBe('Must be a number');
      expect(validateValue('123abc', [rule])).toBe('Must be a number');
    });
    
    test('minValue rule should validate minimum numeric value', () => {
      const rule = minValue(10, 'Must be at least 10');
      
      // Valid values
      expect(validateValue(10, [rule])).toBeNull();
      expect(validateValue(15, [rule])).toBeNull();
      expect(validateValue('20', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue(5, [rule])).toBe('Must be at least 10');
      expect(validateValue('5', [rule])).toBe('Must be at least 10');
    });
    
    test('maxValue rule should validate maximum numeric value', () => {
      const rule = maxValue(10, 'Must be no more than 10');
      
      // Valid values
      expect(validateValue(10, [rule])).toBeNull();
      expect(validateValue(5, [rule])).toBeNull();
      expect(validateValue('0', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue(15, [rule])).toBe('Must be no more than 10');
      expect(validateValue('20', [rule])).toBe('Must be no more than 10');
    });
    
    test('date rule should validate date format', () => {
      const rule = date('Invalid date');
      
      // Valid values
      expect(validateValue('2025-05-16', [rule])).toBeNull();
      expect(validateValue('05/16/2025', [rule])).toBeNull();
      expect(validateValue(new Date(), [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('not-a-date', [rule])).toBe('Invalid date');
      expect(validateValue('2025-13-45', [rule])).toBe('Invalid date');
    });
    
    test('dateRange rule should validate date within range', () => {
      const minDate = '2025-01-01';
      const maxDate = '2025-12-31';
      const rule = dateRange(minDate, maxDate, 'Date must be in 2025');
      
      // Valid values
      expect(validateValue('2025-05-16', [rule])).toBeNull();
      expect(validateValue('2025-01-01', [rule])).toBeNull();
      expect(validateValue('2025-12-31', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue('2024-12-31', [rule])).toBe('Date must be in 2025');
      expect(validateValue('2026-01-01', [rule])).toBe('Date must be in 2025');
    });
    
    test('equals rule should validate matching values', () => {
      const rule = equals('confirmPassword', 'Passwords must match');
      const values = {
        password: 'secret123',
        confirmPassword: 'secret123'
      };
      
      // Valid values
      expect(validateValue('secret123', [rule], values)).toBeNull();
      
      // Invalid values
      expect(validateValue('different', [rule], values)).toBe('Passwords must match');
    });
    
    test('custom rule should use custom validation function', () => {
      const validateEven = (value) => {
        return Number(value) % 2 === 0 || 'Must be an even number';
      };
      const rule = custom(validateEven, 'Custom validation failed');
      
      // Valid values
      expect(validateValue(2, [rule])).toBeNull();
      expect(validateValue('4', [rule])).toBeNull();
      
      // Invalid values
      expect(validateValue(3, [rule])).toBe('Must be an even number');
      expect(validateValue('5', [rule])).toBe('Must be an even number');
    });
  });
  
  describe('Form Validation', () => {
    test('validateObject should return errors for invalid fields', () => {
      const schema = {
        name: [required('Name is required')],
        email: [required('Email is required'), email('Invalid email format')],
        age: [number('Age must be a number'), minValue(18, 'Must be at least 18')]
      };
      
      const validValues = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };
      
      const invalidValues = {
        name: '',
        email: 'invalid-email',
        age: 16
      };
      
      // Valid form
      expect(validateObject(validValues, schema)).toEqual({});
      
      // Invalid form
      const errors = validateObject(invalidValues, schema);
      expect(errors).toHaveProperty('name', 'Name is required');
      expect(errors).toHaveProperty('email', 'Invalid email format');
      expect(errors).toHaveProperty('age', 'Must be at least 18');
    });
    
    test('isFormValid should return boolean validation result', () => {
      const schema = {
        name: [required('Name is required')],
        email: [required('Email is required'), email('Invalid email format')]
      };
      
      const validValues = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const invalidValues = {
        name: 'John Doe',
        email: 'invalid-email'
      };
      
      // Valid form
      expect(isFormValid(validValues, schema)).toBe(true);
      
      // Invalid form
      expect(isFormValid(invalidValues, schema)).toBe(false);
    });
  });
});
