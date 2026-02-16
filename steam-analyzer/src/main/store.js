'use strict';

const ElectronStore = require('electron-store');

const KEYS = {
  LIBRARY: 'library',
  TAG_PROFILE: 'tagProfile',
  WATCHLIST: 'watchlist',
  SETTINGS: 'settings',
};

class Store {
  constructor() {
    this._store = new ElectronStore();
  }

  // --- Library ---
  getLibrary() {
    return this._store.get(KEYS.LIBRARY, []);
  }

  setLibrary(games) {
    this._store.set(KEYS.LIBRARY, games);
  }

  // --- TagProfile ---
  getTagProfile() {
    return this._store.get(KEYS.TAG_PROFILE, null);
  }

  setTagProfile(profile) {
    this._store.set(KEYS.TAG_PROFILE, profile);
  }

  // --- Settings ---
  getSetting(key, defaultValue = undefined) {
    const settings = this._store.get(KEYS.SETTINGS, {});
    return key in settings ? settings[key] : defaultValue;
  }

  setSetting(key, value) {
    const settings = this._store.get(KEYS.SETTINGS, {});
    settings[key] = value;
    this._store.set(KEYS.SETTINGS, settings);
  }

  // --- Watchlist ---
  getWatchlist() {
    return this._store.get(KEYS.WATCHLIST, []);
  }

  setWatchlist(entries) {
    this._store.set(KEYS.WATCHLIST, entries);
  }
}

module.exports = Store;
