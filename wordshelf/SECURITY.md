# Security 

## API Key Security 

### Important Security Information 

This application allows you to use your own API keys from various AI providers (Gemini, OpenAI, Claude, DeepSeek). Please read the following security considerations carefully:


### How we handle your API keys 

1. **Storage**
   - Your API keys are Base64-encoded (NOT encrypted) and stored in Firebase Firestore
   - Base64 encoding only prevents accidental exposure, it is NOT secure encryption

2. **Access Control**
   - Firestore security rules ensure only you can read your own API keys
   - Other users cannot access your keys

3. **Transmission**
   - All data is transmitted over HTTPS (encrypted in transit)
   - API keys are sent to our backend server to make AI API calls

### Security Risks

  **Potential risks you should be aware of:**

1. **Database Access**
   - If someone gains access to the Firestore database, they could decode your API keys
   - This is a limitation of client-side applications

2. **Browser Storage**
   - API keys are temporarily stored in your browser during use
   - Browser extensions or malware could potentially access them

3. **Network Monitoring**
   - Although HTTPS is used, sophisticated attackers might attempt man-in-the-middle attacks

### Best Practices

To minimize risks, we recommend:

✅ **Create API keys with usage limits**
   - Set daily/monthly spending limits on your API provider dashboard
   - Enable IP restrictions if your provider supports it

✅ **Use separate API keys for this app**
   - Don't use the same API key for multiple applications
   - This makes it easier to revoke if needed

✅ **Monitor your API usage regularly**
   - Check your API provider dashboard for unusual activity
   - Set up billing alerts if available

✅ **Revoke and rotate keys if you suspect compromise**
   - All major providers allow you to revoke keys instantly
   - Create a new key and update it in the app

### Alternative: Use Free Mode

If you're concerned about API key security:

- Use the app's **Free Mode** (20 conversions per day)
- No API key required, we handle the AI calls
- Your data is still processed securely

### For Developers

If you're self-hosting this application:

1. Keep your `.env` file private and never commit it to Git
2. Use environment variables in Vercel/deployment platform for production API keys
3. Consider implementing additional security measures like encryption at rest

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

- Open a GitHub Issue with details (but don't include sensitive information)

---

**Disclaimer**

This is an open-source project provided "as is" without warranty of any kind. Users are responsible for protecting their own API keys and monitoring their usage. We recommend reading your AI provider's security documentation and terms of service.
