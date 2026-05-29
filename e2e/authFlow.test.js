const TIMEOUT = 30000;

const SELECTORS = {
  // LoginScreen.tsx uses the same emailInput testID in DEFAULT and PASSWORD modes.
  emailInput: 'emailInput',
  // LoginScreen.tsx EMAIL_OPTIONS mode exposes this exact password-mode switch.
  usePasswordButton: 'usePasswordButton',
  // LoginScreen.tsx PASSWORD mode exposes this exact password input testID.
  passwordInput: 'passwordInput',
  // LoginScreen.tsx now submits password auth with loginButton, not continueButton.
  loginButton: 'loginButton',
  // LoginScreen.tsx renders auth errors with this text testID.
  authErrorText: 'authErrorText',
  // AdminDashboardScreen.tsx root SafeAreaView testID.
  dashboardScreen: 'dashboardScreen',
  // AdminDashboardScreen.tsx greeting title testID, used as an additional dashboard readiness signal.
  dashboardGreetingTitle: 'dashboardGreetingTitle',
  // Header.tsx logout button testID when showLogout is enabled on the dashboard.
  logoutButton: 'logoutButton',
  // InstituteSelectionScreen.tsx root SafeAreaView testID.
  instituteSelectionScreen: 'instituteSelectionScreen',
  // RoleSelectionScreen.tsx root SafeAreaView testID.
  roleSelectionScreen: 'roleSelectionScreen',
  // BrandingHeader.tsx and LoginScreen.tsx theme toggle button testID.
  // Used for theme validation without Android-incompatible device.setAppearance().
  themeToggleButton: 'themeToggleButton',
};

/**
 * InstituteSelectionScreen.tsx changed institute cards from name-derived dashed IDs
 * (instituteCard-guru-nanak-institute) to API ID-based underscored IDs
 * (instituteCard_123). This helper intentionally accepts an institute ID only.
 */
const instituteTestId = instituteId => `instituteCard_${instituteId}`;

/**
 * RoleSelectionScreen.tsx changed role cards from roleCard-Admin style IDs to
 * roleCard_admin style IDs. Keep this sanitization identical to the screen:
 * lowercase, spaces to underscores, then strip non a-z/0-9/_ characters.
 */
const roleTestId = role => {
  const sanitizedRoleName = role
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  return `roleCard_${sanitizedRoleName}`;
};

async function launchFreshApp() {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
}

async function waitForLoginScreen() {
  await waitFor(element(by.id(SELECTORS.emailInput)))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function loginWithPassword(email) {
  await waitForLoginScreen();

  /**
   * Login selectors verified against LoginScreen.tsx:
   * - emailInput: DEFAULT mode email/phone input and PASSWORD mode identifier input.
   * - usePasswordButton: EMAIL_OPTIONS button that switches to PASSWORD mode.
   * - passwordInput: PASSWORD mode password field.
   * - loginButton: PASSWORD mode submit button; continueButton is not used here.
   */
  await element(by.id(SELECTORS.emailInput)).tap();
  await element(by.id(SELECTORS.emailInput)).replaceText(email);

  await waitFor(element(by.id(SELECTORS.usePasswordButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.usePasswordButton)).tap();

  await waitFor(element(by.id(SELECTORS.passwordInput)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.passwordInput)).tap();
  await element(by.id(SELECTORS.passwordInput)).replaceText('123');

  await waitFor(element(by.id(SELECTORS.loginButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.loginButton)).tap();
}

async function expectDashboard() {
  /**
   * Dashboard selectors verified against AdminDashboardScreen.tsx:
   * - dashboardScreen: root SafeAreaView container.
   * - dashboardGreetingTitle: visible greeting text rendered inside the dashboard.
   */
  await waitFor(element(by.id(SELECTORS.dashboardScreen)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await waitFor(element(by.id(SELECTORS.dashboardGreetingTitle)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await expect(element(by.id(SELECTORS.dashboardScreen))).toBeVisible();
}

async function logoutAndExpectLogin() {
  /**
   * Logout selector verified against Header.tsx:
   * - logoutButton: TouchableOpacity rendered when Dashboard passes showLogout.
   */
  await waitFor(element(by.id(SELECTORS.logoutButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.logoutButton)).tap();

  await waitForLoginScreen();
}

async function selectInstituteByName(name) {
  await waitFor(element(by.id(SELECTORS.instituteSelectionScreen)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  /**
   * Institute selectors verified against InstituteSelectionScreen.tsx:
   * - instituteSelectionScreen: root SafeAreaView.
   * - instituteCard_${id}: card Pressable generated from institute_id || id.
   *
   * This helper intentionally keeps the existing name-based test flow. The current
   * UI no longer exposes a name-derived card testID, and the API ID is not passed
   * by the current scenarios, so names use by.text(name) instead of the old broken
   * instituteCard-${name} convention. If a numeric API ID is passed later, it uses
   * instituteTestId(instituteId), which matches the current card testID.
   */
  const instituteMatcher = /^\d+$/.test(String(name))
    ? by.id(instituteTestId(name))
    : by.text(name);

  await waitFor(element(instituteMatcher))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(instituteMatcher).tap();
}

async function selectRole(roleName) {
  await waitFor(element(by.id(SELECTORS.roleSelectionScreen)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  /**
   * Role selectors verified against RoleSelectionScreen.tsx:
   * - roleSelectionScreen: root SafeAreaView.
   * - roleCard_${sanitizedRoleName}: role Pressable using lowercase sanitized names.
   * Examples: Student -> roleCard_student, Admin -> roleCard_admin.
   */
  const id = roleTestId(roleName);

  await waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(id)).tap();
}

async function toggleThemeViaButton() {
  /**
   * Theme toggle helper for Android Detox compatibility.
   * Taps themeToggleButton instead of using device.setAppearance()
   * which is not supported on Android Emulator (android.emu.debug).
   *
   * Location: BrandingHeader.tsx and LoginScreen.tsx.
   */
  await waitFor(element(by.id(SELECTORS.themeToggleButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.themeToggleButton)).tap();
}

describe('MentrixOS Complete Auth Flow', () => {
  beforeEach(async () => {
    await launchFreshApp();
  });

  it('User 1: shows No Institutes Assigned error for ayushb@gmail.com', async () => {
    await loginWithPassword('ayushb@gmail.com');

    await waitFor(element(by.id(SELECTORS.authErrorText)))
      .toBeVisible()
      .withTimeout(TIMEOUT);

    await expect(element(by.id(SELECTORS.authErrorText))).toBeVisible();
  });

  it('User 2: ayushn@gmail.com logs in directly to Dashboard and logs out', async () => {
    await loginWithPassword('ayushn@gmail.com');
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('User 3: divyanshu@gmail.com selects Student role then reaches Dashboard', async () => {
    await loginWithPassword('divyanshu@gmail.com');
    await selectRole('Student');
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('User 4: ayushl@gmail.com selects institute and Admin role then reaches Dashboard', async () => {
    await loginWithPassword('ayushl@gmail.com');
    await selectInstituteByName('Guru Nanak Institute of Technology');
    await selectRole('Admin');
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('User 5: pratik@gmail.com selects institute and Admin role then reaches Dashboard', async () => {
    await loginWithPassword('pratik@gmail.com');
    await selectInstituteByName('Guru Nanak Institute of Technology');
    await selectRole('Admin');
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  // Theme Validation Tests (Android Detox compatible using themeToggleButton)
  // Note: device.setAppearance() is not supported on Android Emulator (android.emu.debug)

  it('Theme Validation: Light Theme - Toggle from default and verify Login screen remains functional', async () => {
    /**
     * Light Theme Test (theme toggle validation without device.setAppearance()).
     * - Launches app with default theme
     * - Verifies Login screen is visible
     * - Toggles theme once to switch appearance
     * - Verifies app remains functional after theme change
     */
    await waitForLoginScreen();

    // Verify Login screen is visible before theme toggle
    await expect(element(by.id(SELECTORS.emailInput))).toBeVisible();

    // Toggle theme via button (tap themeToggleButton to change appearance)
    await toggleThemeViaButton();

    // Verify app remains functional after theme change
    await waitFor(element(by.id(SELECTORS.emailInput)))
      .toBeVisible()
      .withTimeout(TIMEOUT);

    await expect(element(by.id(SELECTORS.emailInput))).toBeVisible();
  });

  it('Theme Validation: Dark Theme - Toggle and verify Login screen and login flow work correctly', async () => {
    /**
     * Dark Theme Test (theme toggle validation without device.setAppearance()).
     * - Launches app with default theme
     * - Toggles theme to switch appearance
     * - Verifies Login screen remains usable after theme change
     * - Executes login flow in toggled theme
     * - Verifies Dashboard is reachable
     */
    await waitForLoginScreen();

    // Toggle theme via button (tap themeToggleButton to change appearance)
    await toggleThemeViaButton();

    // Verify Login screen remains usable after theme change
    await waitFor(element(by.id(SELECTORS.emailInput)))
      .toBeVisible()
      .withTimeout(TIMEOUT);

    await expect(element(by.id(SELECTORS.emailInput))).toBeVisible();

    // Execute login flow in toggled theme
    await loginWithPassword('ayushn@gmail.com');

    // Verify Dashboard is reachable in toggled theme
    await expectDashboard();
  });
});