// ============================================
// AUTH MODULE - Supabase Authentication
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.Auth = (function () {
    var Supabase = FamilyOffice.Supabase;
    var currentUser = null;
    var authListeners = [];

    // Initialize auth state
    function init() {
        return getSession().then(function (session) {
            if (session && session.user) {
                currentUser = session.user;
                notifyListeners(session.user);
            }
            return session;
        });
    }

    // Get current session
    function getSession() {
        var supabase = getSupabaseClient();
        if (!supabase) return Promise.resolve(null);

        return supabase.auth.getSession().then(function (result) {
            if (result.error) {
                console.error('getSession error:', result.error);
                return null;
            }
            return result.data.session;
        });
    }

    // Get Supabase client (helper) - reuse the client from FamilyOffice.Supabase
    function getSupabaseClient() {
        // First, try to get the shared client from FamilyOffice.Supabase
        var Supabase = FamilyOffice.Supabase;
        if (Supabase && Supabase.getClient) {
            return Supabase.getClient();
        }

        // Fallback: use the global shared client or create one
        if (window._supabaseClient) {
            return window._supabaseClient;
        }

        if (window.supabase && window.supabase.createClient) {
            window._supabaseClient = window.supabase.createClient(
                'https://esgglrbynwhiidfljlrh.supabase.co',
                'sb_publishable_9SsVnNYt0Pc_8GQSCUoZzg_wOiVJefl'
            );
            return window._supabaseClient;
        }
        return null;
    }

    // Sign up with email and password
    function signUp(email, password, displayName) {
        var supabase = getSupabaseClient();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: displayName || email.split('@')[0],
                    role: 'Viewer' // Default role for new users
                }
            }
        }).then(function (result) {
            if (result.error) throw result.error;
            return result.data;
        });
    }

    // Sign in with email and password
    function signIn(email, password) {
        var supabase = getSupabaseClient();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase.auth.signInWithPassword({
            email: email,
            password: password
        }).then(function (result) {
            if (result.error) throw result.error;
            currentUser = result.data.user;
            notifyListeners(currentUser);
            return result.data;
        });
    }

    // Sign in with Google
    function signInWithGoogle() {
        var supabase = getSupabaseClient();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        }).then(function (result) {
            if (result.error) throw result.error;
            return result.data;
        });
    }

    // Sign out
    function signOut() {
        var supabase = getSupabaseClient();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase.auth.signOut().then(function (result) {
            if (result.error) throw result.error;
            currentUser = null;
            notifyListeners(null);
            return { success: true };
        });
    }

    // Get current user
    function getCurrentUser() {
        return currentUser;
    }

    // Check if user is authenticated
    function isAuthenticated() {
        return currentUser !== null;
    }

    // Get user role (from metadata)
    function getUserRole() {
        if (!currentUser) return 'Viewer';
        var metadata = currentUser.user_metadata || {};
        return metadata.role || 'Viewer';
    }

    // Get user display name
    function getDisplayName() {
        if (!currentUser) return 'Guest';
        var metadata = currentUser.user_metadata || {};
        return metadata.display_name || metadata.name || currentUser.email.split('@')[0];
    }

    // Check if user is admin
    function isAdmin() {
        return getUserRole() === 'Admin';
    }

    // Update user role (admin only)
    function updateUserRole(userId, newRole) {
        if (!isAdmin()) return Promise.reject('Only admins can update roles');

        var supabase = getSupabaseClient();
        if (!supabase) return Promise.reject('Supabase not initialized');

        return supabase.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        }).then(function (result) {
            if (result.error) throw result.error;
            return result.data;
        });
    }

    // Listen for auth state changes
    function onAuthStateChange(callback) {
        var supabase = getSupabaseClient();
        if (!supabase) return null;

        var subscription = supabase.auth.onAuthStateChange(function (event, session) {
            currentUser = session ? session.user : null;
            callback(event, session);
        });

        return subscription;
    }

    // Add listener for auth changes (internal)
    function addListener(callback) {
        authListeners.push(callback);
    }

    // Notify all listeners
    function notifyListeners(user) {
        authListeners.forEach(function (cb) {
            try { cb(user); } catch (e) { console.error(e); }
        });
    }

    // Render login page
    function renderLoginPage() {
        return '\
        <div class="login-page" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-primary);">\
            <div class="login-card card" style="width: 400px; max-width: 90vw; padding: 40px;">\
                <div style="text-align: center; margin-bottom: 32px;">\
                    <div style="font-size: 48px; margin-bottom: 16px;">🏦</div>\
                    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Dholakia Ventures</h1>\
                    <p class="text-muted" style="margin: 0;">Sign in to your account</p>\
                </div>\
                \
                <div id="login-error" style="display: none; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; margin-bottom: 20px; color: var(--color-error); font-size: 14px;"></div>\
                \
                <form id="login-form">\
                    <div class="form-group" style="margin-bottom: 16px;">\
                        <label class="form-label" style="display: block; margin-bottom: 6px; font-size: 14px;">Email</label>\
                        <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required style="width: 100%; padding: 12px; font-size: 15px;">\
                    </div>\
                    <div class="form-group" style="margin-bottom: 24px;">\
                        <label class="form-label" style="display: block; margin-bottom: 6px; font-size: 14px;">Password</label>\
                        <input type="password" id="login-password" class="form-input" placeholder="••••••••" required style="width: 100%; padding: 12px; font-size: 15px;">\
                    </div>\
                    <button type="submit" id="login-submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 16px; font-weight: 600;">Sign In</button>\
                </form>\
                \
                <div style="display: flex; align-items: center; gap: 12px; margin: 24px 0;">\
                    <div style="flex: 1; height: 1px; background: var(--color-border);"></div>\
                    <span class="text-muted" style="font-size: 12px;">OR</span>\
                    <div style="flex: 1; height: 1px; background: var(--color-border);"></div>\
                </div>\
                \
                <button id="google-signin-btn" class="btn btn-secondary" style="width: 100%; padding: 14px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 10px;">\
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>\
                    Continue with Google\
                </button>\
                \
                <div style="margin-top: 24px; text-align: center;">\
                    <p class="text-muted" style="font-size: 13px;">Don\'t have an account? <a href="#" id="show-signup" style="color: var(--color-accent-primary);">Sign up</a></p>\
                </div>\
            </div>\
        </div>';
    }

    // Render signup page
    function renderSignupPage() {
        return '\
        <div class="signup-page" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg-primary);">\
            <div class="signup-card card" style="width: 400px; max-width: 90vw; padding: 40px;">\
                <div style="text-align: center; margin-bottom: 32px;">\
                    <div style="font-size: 48px; margin-bottom: 16px;">🏦</div>\
                    <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Create Account</h1>\
                    <p class="text-muted" style="margin: 0;">Join Dholakia Ventures</p>\
                </div>\
                \
                <div id="signup-error" style="display: none; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; margin-bottom: 20px; color: var(--color-error); font-size: 14px;"></div>\
                <div id="signup-success" style="display: none; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; margin-bottom: 20px; color: var(--color-success); font-size: 14px;"></div>\
                \
                <form id="signup-form">\
                    <div class="form-group" style="margin-bottom: 16px;">\
                        <label class="form-label" style="display: block; margin-bottom: 6px; font-size: 14px;">Name</label>\
                        <input type="text" id="signup-name" class="form-input" placeholder="Your name" required style="width: 100%; padding: 12px; font-size: 15px;">\
                    </div>\
                    <div class="form-group" style="margin-bottom: 16px;">\
                        <label class="form-label" style="display: block; margin-bottom: 6px; font-size: 14px;">Email</label>\
                        <input type="email" id="signup-email" class="form-input" placeholder="you@example.com" required style="width: 100%; padding: 12px; font-size: 15px;">\
                    </div>\
                    <div class="form-group" style="margin-bottom: 24px;">\
                        <label class="form-label" style="display: block; margin-bottom: 6px; font-size: 14px;">Password</label>\
                        <input type="password" id="signup-password" class="form-input" placeholder="••••••••" required minlength="6" style="width: 100%; padding: 12px; font-size: 15px;">\
                        <span class="text-muted" style="font-size: 12px; margin-top: 4px; display: block;">At least 6 characters</span>\
                    </div>\
                    <button type="submit" id="signup-submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 16px; font-weight: 600;">Create Account</button>\
                </form>\
                \
                <div style="margin-top: 24px; text-align: center;">\
                    <p class="text-muted" style="font-size: 13px;">Already have an account? <a href="#" id="show-login" style="color: var(--color-accent-primary);">Sign in</a></p>\
                </div>\
            </div>\
        </div>';
    }

    // Initialize login form events
    function initLoginEvents() {
        // Login form submit
        document.addEventListener('submit', function (e) {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                var email = document.getElementById('login-email').value;
                var password = document.getElementById('login-password').value;
                var errorEl = document.getElementById('login-error');
                var submitBtn = document.getElementById('login-submit');

                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
                errorEl.style.display = 'none';

                signIn(email, password)
                    .then(function () {
                        window.location.reload();
                    })
                    .catch(function (err) {
                        errorEl.textContent = err.message || 'Failed to sign in';
                        errorEl.style.display = 'block';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Sign In';
                    });
            }
        });

        // Signup form submit
        document.addEventListener('submit', function (e) {
            if (e.target.id === 'signup-form') {
                e.preventDefault();
                var name = document.getElementById('signup-name').value;
                var email = document.getElementById('signup-email').value;
                var password = document.getElementById('signup-password').value;
                var errorEl = document.getElementById('signup-error');
                var successEl = document.getElementById('signup-success');
                var submitBtn = document.getElementById('signup-submit');

                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
                errorEl.style.display = 'none';
                successEl.style.display = 'none';

                signUp(email, password, name)
                    .then(function (data) {
                        if (data.user && !data.user.confirmed_at) {
                            successEl.textContent = 'Check your email for a confirmation link!';
                            successEl.style.display = 'block';
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Create Account';
                        } else {
                            window.location.reload();
                        }
                    })
                    .catch(function (err) {
                        errorEl.textContent = err.message || 'Failed to create account';
                        errorEl.style.display = 'block';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Create Account';
                    });
            }
        });

        // Google sign in
        document.addEventListener('click', function (e) {
            if (e.target.closest('#google-signin-btn')) {
                e.preventDefault();
                signInWithGoogle();
            }
        });

        // Toggle between login and signup
        document.addEventListener('click', function (e) {
            if (e.target.id === 'show-signup') {
                e.preventDefault();
                document.getElementById('app-container').innerHTML = renderSignupPage();
            }
            if (e.target.id === 'show-login') {
                e.preventDefault();
                document.getElementById('app-container').innerHTML = renderLoginPage();
            }
        });
    }

    // Initialize events on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginEvents);
    } else {
        initLoginEvents();
    }

    return {
        init: init,
        signUp: signUp,
        signIn: signIn,
        signInWithGoogle: signInWithGoogle,
        signOut: signOut,
        getCurrentUser: getCurrentUser,
        isAuthenticated: isAuthenticated,
        getUserRole: getUserRole,
        getDisplayName: getDisplayName,
        isAdmin: isAdmin,
        onAuthStateChange: onAuthStateChange,
        addListener: addListener,
        renderLoginPage: renderLoginPage,
        renderSignupPage: renderSignupPage
    };
})();
