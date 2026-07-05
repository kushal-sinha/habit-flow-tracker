const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .glb, .gltf, and .bin to the list of asset extensions so Metro recognizes 3D models and buffers as static assets
const extraExtensions = ['glb', 'gltf', 'bin', 'html'];
extraExtensions.forEach(ext => {
  if (!config.resolver.assetExts.includes(ext)) {
    config.resolver.assetExts.push(ext);
  }
});

module.exports = config;
