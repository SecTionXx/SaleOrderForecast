# Security Guide: Handling Sensitive Data

This guide outlines best practices for handling sensitive data in the SaleOrderForecast application.

## 🔒 Environment Variables

### Setting Up Environment Variables

1. **Never commit `.env` files to version control**
   - The `.env.example` file provides a template for required variables
   - Each developer should create their own `.env` file locally
   - Production environments should set environment variables through platform configuration

2. **Required Environment Variables**
   ```
   # API Keys
   GOOGLE_API_KEY=your_google_api_key_here
   GOOGLE_SHEET_ID=your_sheet_id_here
   
   # Authentication Secrets
   JWT_SECRET=strong_random_secret_here
   REFRESH_SECRET=different_strong_random_secret_here
   
   # API Security
   ALLOWED_ORIGIN=https://your-production-domain.com
   ```

3. **Generating Secure Secrets**
   - Use a secure random generator for secrets
   - Example (Node.js): `require('crypto').randomBytes(64).toString('hex')`
   - Minimum length: 32 characters for JWT_SECRET and REFRESH_SECRET

### Accessing Environment Variables

1. **Always use the secure environment handler**
   - Import: `const env = require('./utils/envHandler')`
   - Regular variables: `env.getEnv('VARIABLE_NAME', 'default_value')`
   - Sensitive variables: `env.getSensitiveEnv('SECRET_VARIABLE')`

2. **Never access `process.env` directly**
   - Direct access bypasses security measures
   - Use the environment handler to ensure proper handling

## 🛡️ API Key Security

1. **API Key Storage**
   - Store API keys as environment variables only
   - Never hardcode API keys in source code
   - Never expose API keys in client-side code

2. **API Key Usage**
   - Only use API keys in server-side code
   - Implement rate limiting to prevent abuse
   - Use the minimum required permissions/scopes

3. **API Key Rotation**
   - Rotate API keys periodically
   - Have a process for emergency key rotation
   - Update environment variables without application downtime

## 🔐 Authentication Secrets

1. **JWT and Refresh Tokens**
   - Store secrets as environment variables
   - Use different secrets for JWT and refresh tokens
   - Set appropriate expiration times
   - JWT: Short-lived (1-2 hours)
   - Refresh tokens: Longer-lived (7 days)

2. **Secure Cookie Configuration**
   ```javascript
   res.cookie('refreshToken', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'strict',
     maxAge: config.auth.refreshTokenExpiry * 1000
   });
   ```

3. **Token Validation**
   - Always validate tokens on the server side
   - Check expiration, signature, and issuer
   - Implement token revocation for logout and security events

## 📝 Logging Best Practices

1. **Never log sensitive data**
   - API keys
   - Authentication tokens
   - User passwords
   - Personal identifiable information (PII)

2. **Safe Logging**
   - Use the `safeLogEnv()` function for environment variables
   - Mask sensitive values in logs (e.g., `apiKey: '****'`)
   - Log only what's necessary for debugging

3. **Log Rotation and Retention**
   - Implement log rotation to limit file size
   - Set appropriate retention periods
   - Ensure logs are stored securely

## 🌐 Client-Side Security

1. **Never store sensitive data in client storage**
   - LocalStorage and SessionStorage are not secure for sensitive data
   - Use HttpOnly cookies for authentication tokens
   - Store only non-sensitive user preferences in client storage

2. **API Request Security**
   - Always use HTTPS
   - Implement CSRF protection
   - Validate and sanitize all inputs
   - Use the `sanitizeRequestData()` function before sending data

3. **Content Security Policy**
   - Restrict resource loading to trusted sources
   - Prevent XSS attacks
   - Configure CSP headers in server responses

## 🚨 Security Incident Response

1. **Detecting Security Issues**
   - Monitor for unusual API usage patterns
   - Implement logging for authentication failures
   - Set up alerts for potential security events

2. **Response Procedure**
   - Immediately rotate compromised credentials
   - Assess the impact and scope of the incident
   - Document the incident and resolution steps
   - Update security measures to prevent recurrence

## 🔄 Regular Security Practices

1. **Dependency Updates**
   - Regularly update dependencies to patch security vulnerabilities
   - Use `npm audit` to identify vulnerable packages
   - Consider using automated dependency update tools

2. **Code Reviews**
   - Always review code for security issues
   - Pay special attention to code handling sensitive data
   - Use the security checklist in code review template

3. **Security Testing**
   - Implement security-focused tests
   - Consider periodic security audits
   - Test authentication and authorization flows thoroughly

---

## Implementation Examples

### Secure Environment Variable Usage

```javascript
// GOOD: Using the secure environment handler
const apiKey = env.getSensitiveEnv('API_KEY');

// BAD: Direct access to process.env
const apiKey = process.env.API_KEY;
```

### Secure API Request

```javascript
// GOOD: Sanitizing data before sending
import { sanitizeRequestData } from './utils/clientInputValidator.js';

async function submitData(data) {
  const sanitizedData = sanitizeRequestData(data);
  return await api.post('/endpoint', sanitizedData);
}

// BAD: Sending unsanitized data
async function submitData(data) {
  return await api.post('/endpoint', data);
}
```

### Secure Configuration

```javascript
// GOOD: Using getSafeConfig for logging
console.log('App config:', config.getSafeConfig());

// BAD: Logging the entire config (may contain secrets)
console.log('App config:', config);
```

---

By following these guidelines, we can ensure that sensitive data in the SaleOrderForecast application is handled securely throughout the development lifecycle.
