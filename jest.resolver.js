const fs = require('fs');
const path = require('path');
const workletsResolver = require('react-native-worklets/jest/resolver');

function resolveExpoModulesCore(request, options) {
  const hoisted = path.join(options.rootDir, 'node_modules/expo-modules-core');
  const nested = path.join(options.rootDir, 'node_modules/expo/node_modules/expo-modules-core');
  const packageRoot = fs.existsSync(hoisted) ? hoisted : nested;
  const rewritten =
    request === 'expo-modules-core'
      ? packageRoot
      : path.join(packageRoot, request.slice('expo-modules-core/'.length));

  return options.defaultResolver(rewritten, options);
}

module.exports = (request, options) => {
  if (request === 'expo-modules-core' || request.startsWith('expo-modules-core/')) {
    return resolveExpoModulesCore(request, options);
  }

  return workletsResolver(request, options);
};
