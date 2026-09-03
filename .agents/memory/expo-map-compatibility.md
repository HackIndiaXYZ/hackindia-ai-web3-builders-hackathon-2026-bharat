---
name: Expo map compatibility
description: Platform-specific handling for react-native-maps in Expo apps that also render on web.
---

Native map packages can break the Expo web bundle even when the screen branches on Platform.OS, because Metro still evaluates static imports. Keep react-native-maps imports in a `.native.tsx` component and provide a web-safe `.tsx` sibling; import the shared component by its platform-neutral name.

**Why:** The native map package imports React Native codegen internals that Expo web cannot bundle.

**How to apply:** Any Expo app that previews on web and needs react-native-maps should use platform-specific component resolution rather than a conditional static import.