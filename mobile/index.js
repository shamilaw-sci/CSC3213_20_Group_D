/**
 * @file index.js
 * @module Application
 * @desc Registers the Care4U Expo application entry point.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
