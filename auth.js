import { supabase } from "./supabaseClient.js";
// Protect the dashboard while authentication is being checked.
const dashboard = document.querySelector("main.container");

if (dashboard) {
    dashboard.hidden = true;
}

const authLoading = document.createElement("div");
authLoading.id = "authLoading";
authLoading.textContent = "Checking your login...";
authLoading.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0b1220;
    color: #e2e8f0;
    font: 16px Arial, sans-serif;
    z-index: 9998;
`;

document.body.appendChild(authLoading);

const style = document.createElement("style");
style.textContent = `
.auth-bar {
    display: flex; justify-content: flex-end; align-items: center;
    gap: 12px; padding: 12px 5%; border-bottom: 1px solid #e5e7eb;
    font-family: Arial, sans-serif;
}
.auth-button {
    border: 0; border-radius: 8px; padding: 10px 16px;
    cursor: pointer; font-weight: 600; background: #2563eb; color: white;
}
.auth-button.secondary { background: #eef2ff; color: #1e40af; }
.auth-email { color: #374151; font-size: 14px; overflow-wrap: anywhere; }
.auth-overlay {
    position: fixed; inset: 0; z-index: 9999; display: none;
    align-items: center; justify-content: center; padding: 18px;
    background: rgba(15,23,42,.65); font-family: Arial, sans-serif;
}
.auth-card {
    background: white; color: #111827; width: 100%; max-width: 400px;
    box-sizing: border-box; padding: 28px; border-radius: 16px;
    box-shadow: 0 20px 60px #0003;
}
.auth-card h2 { margin-top: 0; }
.auth-card input {
    box-sizing: border-box; display: block; width: 100%;
    padding: 12px; margin: 12px 0; border: 1px solid #d1d5db;
    border-radius: 8px; font-size: 15px;
}
.auth-card button { margin: 5px 0; }
.auth-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.auth-message { font-size: 14px; overflow-wrap: anywhere; }
.auth-close { float: right; background: transparent; color: #374151;
    border: 0; font-size: 22px; cursor: pointer; }
    .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0 12px;
    color: #64748b;
    font-size: 12px;
}

.auth-divider::before,
.auth-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #334155;
}

.google-button {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    color: #111827;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
}

.google-button:hover {
    background: #f1f5f9;
}

.google-g {
    font-size: 20px;
    font-weight: 700;
    color: #4285f4;
}
`;
document.head.appendChild(style);

const bar = document.createElement("div");
bar.className = "auth-bar";
bar.innerHTML = `
    <span id="authUser" class="auth-email">Not signed in</span>
    <button id="authOpen" class="auth-button" type="button">Login / Sign up</button>
    <button id="authLogout" class="auth-button secondary" type="button"
        hidden>Logout</button>
`;
document.body.prepend(bar);

const overlay = document.createElement("div");
overlay.className = "auth-overlay";
overlay.id = "authOverlay";
overlay.innerHTML = `
  <section class="auth-card" role="dialog" aria-modal="true"
      aria-labelledby="authTitle">
    <button id="authClose" class="auth-close" type="button"
        aria-label="Close">×</button>
    <h2 id="authTitle">Welcome to ContestClock</h2>
    <p>Sign in or create your student account.</p>
    <form id="authForm">
      <input id="authEmail" type="email" placeholder="Email address"
          autocomplete="email" required>
      <input id="authPassword" type="password" placeholder="Password"
          autocomplete="current-password" minlength="6" required>
      <div class="auth-actions">
        <button class="auth-button" type="submit" id="authLogin">
          Login
        </button>
        <button class="auth-button secondary" type="button" id="authSignup">
          Sign up
        </button>
      </div>
      <div class="auth-divider">or continue with</div>

<button class="google-button" type="button" id="authGoogle">
  <span class="google-g">G</span>
  Continue with Google
</button>
    </form>
    <p id="authMessage" class="auth-message" role="status"
        aria-live="polite"></p>
  </section>
`;
document.body.appendChild(overlay);

const $ = id => document.getElementById(id);
const setMessage = message => { $("authMessage").textContent = message; };

function openAuth() {
    overlay.style.display = "flex";
    setMessage("");
}

function closeAuth() {
    overlay.style.display = "none";
}

$("authOpen").addEventListener("click", openAuth);
$("authClose").addEventListener("click", closeAuth);

overlay.addEventListener("click", event => {
    if (event.target === overlay) closeAuth();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAuth();
});

function showUser(user) {
    $("authUser").textContent = user ? user.email : "Not signed in";
    $("authOpen").hidden = Boolean(user);
    $("authLogout").hidden = !user;

    if (dashboard) {
        dashboard.hidden = !user;
    }

    authLoading.style.display = "none";

    if (!user) {
        openAuth();
        setMessage("Please log in to access the ContestClock dashboard.");
    }
}

async function login() {
    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;

    if (!email || !password) {
        setMessage("Enter your email and password.");
        return;
    }

    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        setMessage(error.message);
        return;
    }

    setMessage("Login successful!");
    closeAuth();
}

async function signup() {
    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;

    if (!email || !password) {
        setMessage("Enter your email and password.");
        return;
    }

    if (password.length < 6) {
        setMessage("Use a password with at least 6 characters.");
        return;
    }

    setMessage("Creating your account...");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin
        }
    });

    if (error) {
        setMessage(error.message);
        return;
    }

    if (data.session) {
        setMessage("Account created and signed in!");
        closeAuth();
    } else {
        setMessage(
            "Account created. Check your email for the confirmation link, " +
            "then return here and log in."
        );
    }
}

$("authForm").addEventListener("submit", async event => {
    event.preventDefault();
    await login();
});

$("authSignup").addEventListener("click", signup);
$("authGoogle").addEventListener("click", async () => {
    setMessage("Connecting to Google...");

    const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        setMessage("Google login failed: " + error.message);
    }
});

$("authLogout").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert("Could not log out: " + error.message);
        return;
    }

    showUser(null);
});

supabase.auth.onAuthStateChange((_event, session) => {
    showUser(session?.user ?? null);
});

async function initializeAuth() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Session check failed:", error);
            authLoading.textContent =
                "Unable to check your login. Refresh the page and try again.";
            return;
        }

        showUser(data.session?.user ?? null);
    } catch (error) {
        console.error("Authentication initialization failed:", error);
        authLoading.textContent =
            "Unable to check your login. Refresh the page and try again.";
    }
}

initializeAuth();
