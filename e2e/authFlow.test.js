/* global device, waitFor, element, by */

const TIMEOUT = 30000;
const VALID_PASSWORD = '123';
const INVALID_PASSWORD = 'wrong-password';
const INSTITUTE_NAME = 'Guru Nanak Institute of Technology';

const USERS = {
  noInstitute: 'ayushb@gmail.com',
  directDashboard: 'ayushn@gmail.com',
  roleSelection: 'divyanshu@gmail.com',
  instituteAndRoleSelection: 'ayushl@gmail.com',
};

const SELECTORS = {
  // LoginScreen.tsx uses the same emailInput testID in DEFAULT and PASSWORD modes.
  emailInput: 'emailInput',
  // LoginScreen.tsx EMAIL_OPTIONS mode exposes this exact password-mode switch.
  usePasswordButton: 'usePasswordButton',
  // LoginScreen.tsx PASSWORD mode exposes this exact password input testID.
  passwordInput: 'passwordInput',
  // LoginScreen.tsx submits password auth with loginButton; continueButton is not used.
  loginButton: 'loginButton',
  // LoginScreen.tsx renders backend/auth errors with this text testID.
  authErrorText: 'authErrorText',
  // LoginScreen.tsx and BrandingHeader.tsx expose the theme toggle with this testID.
  themeToggleButton: 'themeToggleButton',
  // InstituteSelectionScreen.tsx root SafeAreaView testID.
  instituteSelectionScreen: 'instituteSelectionScreen',
  // RoleSelectionScreen.tsx root SafeAreaView testID.
  roleSelectionScreen: 'roleSelectionScreen',
  // AdminDashboardScreen.tsx root SafeAreaView testID.
  dashboardScreen: 'dashboardScreen',
  // AdminDashboardScreen.tsx greeting title testID, used as dashboard readiness signal.
  dashboardGreetingTitle: 'dashboardGreetingTitle',
  // Header.tsx logout button testID when showLogout is enabled on Dashboard.
  logoutButton: 'logoutButton',
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

async function launchFreshApp(deleteApp = true) {
  await device.launchApp({
    newInstance: true,
    delete: deleteApp,
  });
}

async function relaunchAppWithoutDeletingData() {
  await device.launchApp({
    newInstance: true,
    delete: false,
  });
}

async function waitForLoginScreen() {
  await waitFor(element(by.id(SELECTORS.emailInput)))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function expectLoginScreen() {
  await waitForLoginScreen();
  await expect(element(by.id(SELECTORS.emailInput))).toBeVisible();
}

async function enterEmailOrPhone(value) {
  await waitForLoginScreen();
  await element(by.id(SELECTORS.emailInput)).tap();
  await element(by.id(SELECTORS.emailInput)).replaceText(value);
}

async function openPasswordFlow(email) {
  await enterEmailOrPhone(email);

  await waitFor(element(by.id(SELECTORS.usePasswordButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.usePasswordButton)).tap();

  await waitFor(element(by.id(SELECTORS.passwordInput)))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function submitPassword(password) {
  if (password) {
    await element(by.id(SELECTORS.passwordInput)).tap();
    await element(by.id(SELECTORS.passwordInput)).replaceText(password);
  }

  await waitFor(element(by.id(SELECTORS.loginButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await element(by.id(SELECTORS.loginButton)).tap();
}

async function loginWithPassword(email, password = VALID_PASSWORD) {
  /**
   * Login selectors verified against LoginScreen.tsx:
   * - emailInput: DEFAULT mode email/phone input and PASSWORD mode identifier input.
   * - usePasswordButton: EMAIL_OPTIONS button that switches to PASSWORD mode.
   * - passwordInput: PASSWORD mode password field.
   * - loginButton: PASSWORD mode submit button.
   */
  await openPasswordFlow(email);
  await submitPassword(password);
}

async function expectAuthError() {
  await waitFor(element(by.id(SELECTORS.authErrorText)))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await expect(element(by.id(SELECTORS.authErrorText))).toBeVisible();
}

async function expectMissingCredentialsValidation() {
  await waitFor(element(by.text('Please enter both Email/Phone and Password')))
    .toBeVisible()
    .withTimeout(TIMEOUT);

  await expect(element(by.text('Please enter both Email/Phone and Password'))).toBeVisible();
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
  await expect(element(by.id(SELECTORS.dashboardGreetingTitle))).toBeVisible();
}

async function expectNotOnDashboard() {
  await expect(element(by.id(SELECTORS.dashboardScreen))).not.toBeVisible();
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
  await expectLoginScreen();
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
   * Current scenarios pass the visible institute name, not the API ID, so names
   * use by.text(name) instead of the old broken instituteCard-${name} convention.
   * If a numeric API ID is passed later, this uses instituteTestId(instituteId).
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

async function verifyThemeToggleAvailable() {
  await waitFor(element(by.id(SELECTORS.themeToggleButton)))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function switchTheme() {
  await verifyThemeToggleAvailable();
  await element(by.id(SELECTORS.themeToggleButton)).tap();
  await expectLoginScreen();
}

async function ensureLightTheme() {
  /**
   * ThemeContext starts from the device/system theme on a clean launch. Detox
   * cannot directly assert React Native colors, so Exercise 5 validates that the
   * requested theme control is visible and the auth UI remains usable after the
   * theme state is set/toggled.
   */
  await device.setAppearance('light');
  await launchFreshApp(true);
  await verifyThemeToggleAvailable();
  await expectLoginScreen();
}

async function enableDarkTheme() {
  await device.setAppearance('light');
  await launchFreshApp(true);
  await switchTheme();
}

describe('Negative Flow Tests', () => {
  beforeEach(async () => {
    await launchFreshApp();
  });

  it('NF_001 - Invalid Email Format: shows validation/auth error and blocks dashboard access', async () => {
    // Scenario verifies invalid email format cannot complete password login.
    await loginWithPassword('ayush@', VALID_PASSWORD);
    await expectAuthError();
    await expectLoginScreen();
    await expectNotOnDashboard();
  });

  it('NF_002 - Empty Email Field: keeps user on login and does not expose password flow', async () => {
    // Scenario verifies empty email/mobile input cannot proceed to password flow.
    await waitForLoginScreen();
    await element(by.id(SELECTORS.emailInput)).tap();
    await element(by.id(SELECTORS.emailInput)).replaceText('');

    await expect(element(by.id(SELECTORS.usePasswordButton))).not.toBeVisible();
    await expectLoginScreen();
    await expectNotOnDashboard();
  });

  it('NF_003 - Invalid Password: shows authentication error and remains on login screen', async () => {
    // Scenario verifies valid email with incorrect password is rejected.
    await loginWithPassword(USERS.directDashboard, INVALID_PASSWORD);
    await expectAuthError();
    await expectLoginScreen();
    await expectNotOnDashboard();
  });

  it('NF_004 - Empty Password: shows missing credentials validation and blocks authentication', async () => {
    // Scenario verifies login cannot be submitted with a blank password.
    await openPasswordFlow(USERS.directDashboard);
    await submitPassword('');
    await expectMissingCredentialsValidation();
    await expectNotOnDashboard();
  });

  it('NF_005 - No Institute Assigned User: shows no-institute error and blocks dashboard access', async () => {
    // Scenario verifies valid credentials for a user without institutes stay in auth flow.
    await loginWithPassword(USERS.noInstitute);
    await expectAuthError();
    await expectLoginScreen();
    await expectNotOnDashboard();
  });
});

describe('Positive Flow Tests - Light Theme', () => {
  beforeEach(async () => {
    await ensureLightTheme();
  });

  it('PF_LIGHT_001 - Direct Dashboard User: logs in, verifies dashboard greeting, and logs out', async () => {
    // Scenario verifies a single-institute/single-role user reaches Dashboard directly.
    await loginWithPassword(USERS.directDashboard);
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('PF_LIGHT_002 - Role Selection User: selects Student role and reaches Dashboard', async () => {
    // Scenario verifies role selection before Dashboard for a multi-role user.
    await loginWithPassword(USERS.roleSelection);
    await waitFor(element(by.id(SELECTORS.roleSelectionScreen)))
      .toBeVisible()
      .withTimeout(TIMEOUT);
    await selectRole('Student');
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('PF_LIGHT_003 - Institute Selection + Role Selection User: selects institute and Admin role', async () => {
    // Scenario verifies the complete institute selection plus role selection path.
    await loginWithPassword(USERS.instituteAndRoleSelection);
    await waitFor(element(by.id(SELECTORS.instituteSelectionScreen)))
      .toBeVisible()
      .withTimeout(TIMEOUT);
    await selectInstituteByName(INSTITUTE_NAME);
    await waitFor(element(by.id(SELECTORS.roleSelectionScreen)))
      .toBeVisible()
      .withTimeout(TIMEOUT);
    await selectRole('Admin');
    await expectDashboard();
    await logoutAndExpectLogin();
  });
});

describe('Positive Flow Tests - Dark Theme', () => {
  beforeEach(async () => {
    await enableDarkTheme();
  });

  it('PF_DARK_001 - Direct Dashboard User: completes direct dashboard flow in dark theme', async () => {
    // Scenario verifies direct Dashboard authentication remains stable after dark theme toggle.
    await loginWithPassword(USERS.directDashboard);
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('PF_DARK_002 - Role Selection User: selects Student role and reaches Dashboard in dark theme', async () => {
    // Scenario verifies role selection remains stable after dark theme toggle.
    await loginWithPassword(USERS.roleSelection);
    await selectRole('Student');
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('PF_DARK_003 - Institute Selection + Role Selection User: completes full flow in dark theme', async () => {
    // Scenario verifies institute and role selection remain stable after dark theme toggle.
    await loginWithPassword(USERS.instituteAndRoleSelection);
    await selectInstituteByName(INSTITUTE_NAME);
    await selectRole('Admin');
    await expectDashboard();
    await logoutAndExpectLogin();
  });
});

describe('Theme Validation Tests', () => {
  it('THM_001 - Switch Light Theme to Dark Theme: theme toggle remains functional', async () => {
    // Scenario verifies the Light-to-Dark theme control is visible and usable.
    await ensureLightTheme();
    await switchTheme();
    await verifyThemeToggleAvailable();
    await expectLoginScreen();
  });

  it('THM_002 - Switch Dark Theme to Light Theme: theme toggle remains functional', async () => {
    // Scenario verifies the Dark-to-Light theme control is visible and usable.
    await enableDarkTheme();
    await switchTheme();
    await verifyThemeToggleAvailable();
    await expectLoginScreen();
  });
});

describe('Logout Validation Tests', () => {
  beforeEach(async () => {
    await ensureLightTheme();
  });

  it('LOG_001 - Verify Logout Functionality: returns user to Login screen', async () => {
    // Scenario verifies Dashboard logout terminates the active authenticated view.
    await loginWithPassword(USERS.directDashboard);
    await expectDashboard();
    await logoutAndExpectLogin();
  });

  it('LOG_002 - Verify Session Clearance After Logout: relaunch requires login again', async () => {
    // Scenario verifies logout does not leave the app on Dashboard after relaunch.
    await loginWithPassword(USERS.directDashboard);
    await expectDashboard();
    await logoutAndExpectLogin();
    await relaunchAppWithoutDeletingData();
    await expectLoginScreen();
    await expectNotOnDashboard();
  });
});
