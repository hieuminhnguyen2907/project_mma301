import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Keyboard-aware scroll view and input focus integration', async (t) => {
  await t.test('KeyboardAwareScrollView component file exists and exports context & component', () => {
    const file = fs.readFileSync(path.resolve('src/components/common/KeyboardAwareScrollView.js'), 'utf8');
    assert.match(file, /export const KeyboardAwareContext = createContext/);
    assert.match(file, /export const KeyboardAwareScrollView = forwardRef/);
    assert.match(file, /Keyboard\.addListener/);
    assert.match(file, /scrollNodeIntoView/);
    assert.match(file, /measureInWindow/);
    assert.doesNotMatch(file, /measureLayout/, 'Must not use measureLayout which causes native ref warnings');
  });

  await t.test('Input component integrates with KeyboardAwareContext and wraps container with ref', () => {
    const file = fs.readFileSync(path.resolve('src/components/common/Input.js'), 'utf8');
    assert.match(file, /KeyboardAwareContext/);
    assert.match(file, /keyboardContext.*scrollToInput.*containerRef\.current/);
    assert.match(file, /collapsable=\{false\}/);
    assert.match(file, /ref=\{containerRef\}/);
  });

  await t.test('Modal component defaults to scrollable with KeyboardAwareScrollView', () => {
    const file = fs.readFileSync(path.resolve('src/components/common/Modal.js'), 'utf8');
    assert.match(file, /scrollable = true/);
    assert.match(file, /KeyboardAwareScrollView/);
  });

  await t.test('Key form screens adopt KeyboardAwareScrollView instead of unscrollable views', () => {
    const screens = [
      'src/screens/sell/CreateListingScreen.js',
      'src/screens/cart/CheckoutScreen.js',
      'src/screens/reviews/CreateReviewScreen.js',
      'src/screens/disputes/CreateReturnScreen.js',
      'src/screens/disputes/CreateReportScreen.js',
      'src/screens/auth/LoginScreen.js',
      'src/screens/auth/RegisterScreen.js',
      'src/screens/auth/ForgotPasswordScreen.js',
      'src/screens/profile/EditProfileScreen.js',
    ];

    for (const screenPath of screens) {
      const content = fs.readFileSync(path.resolve(screenPath), 'utf8');
      assert.ok(
        content.includes('KeyboardAwareScrollView'),
        `${screenPath} must include KeyboardAwareScrollView`
      );
    }
  });
});
