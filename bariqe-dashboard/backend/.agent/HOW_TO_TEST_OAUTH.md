# How to Test Google OAuth Configuration

Since OAuth 2.0 requires user interaction (signing into Google), testing it involves a browser. Postman is useful for verifying the initial redirect, but completing the flow requires a browser.

## prerequisites
Ensure your `.env` file has these valid credentials:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
SESSION_SECRET=your_secret
ALLOWED_EMAIL_DOMAIN=@yourcompany.com (or comment out domain check for testing)
```

## Option 1: The Browser Method (Recommended)

This is the most realistic test as it mimics exactly what your frontend will do.

1.  **Open your browser** (Chrome, Firefox, etc.).
2.  **Navigate to**:
    ```
    http://localhost:8080/api/auth/google
    ```
3.  **Login**: You should be automatically redirected to Google's login page. Sign in with a Google account.
4.  **Verify Success**:
    - If successful, you should be redirected to your frontend (e.g., `localhost:3000/auth/callback?success=true`).
    - **Verify Cookie**: Open Developer Tools (F12) -> Application -> Cookies. You should see an `accessToken` cookie set.

## Option 2: Postman + Browser (Hybrid)

If you strictly want to initiate from Postman:

1.  **Create a Request**:
    - Method: `GET`
    - URL: `http://localhost:8080/api/auth/google`
2.  **Send Request**:
    - By default, Postman might show you the HTML of the Google Login page (if "Automatically Follow Redirects" is ON).
    - If you turn "Automatically Follow Redirects" **OFF** (in Settings -> General), you will see a `302 Found` status.
3.  **Get the Link**:
    - Look at the `Location` header in the response. It will be a long URL starting with `https://accounts.google.com/o/oauth2/v2/auth...`.
4.  **Copy & Paste**:
    - Copy that URL and paste it into your browser to complete the login.

## Option 3: Postman OAuth 2.0 Authorization Tab

Postman has a built-in OAuth tool, but it's designed for APIs that return a token in the URL/Body, not for cookie-based sessions. However, you can try simulating it:

1.  Go to the **Authorization** tab of a new request.
2.  Select Type: **OAuth 2.0**.
3.  Scroll down to "Configure New Token":
    - **Token Name**: Google Auth
    - **Grant Type**: Authorization Code
    - **Callback URL**: `http://localhost:8080/api/auth/google/callback` (Must match Google Console)
    - **Auth URL**: `http://localhost:8080/api/auth/google` (Or the direct Google URL)
    - **Access Token URL**: *Leave blank or put dummy* (Since we handle this on backend)
    - **Client ID**: *Your Google Client ID*
    - **Client Secret**: *Your Google Client Secret*
    - **Scope**: `profile email`
4.  Click **Get New Access Token**.
    - Postman will pop up a browser window.
    - Login to Google.
    - **Note**: This might fail at the end because your backend redirects to your *frontend* (localhost:3000), not back to Postman, and doesn't return the token in the response body (it sets a cookie).

**Verdict**: Use **Option 1** for the most accurate test of your implementation.
