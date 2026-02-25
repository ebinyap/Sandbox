/**
 * @jest-environment jsdom
 */
'use strict';

describe('store-recommend.js', () => {
  beforeEach(() => {
    // DOM セットアップ
    document.body.innerHTML = `
      <div id="tab-store-recommend" class="tab-panel active"></div>
    `;
    global.window.api = { getLibrary: jest.fn().mockResolvedValue({ success: true, data: [] }) };
    global.window.PriceBar = { render: jest.fn().mockReturnValue('') };
    jest.resetModules();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete global.window.api;
    delete global.window.PriceBar;
  });

  describe('Store Mode', () => {
    test('ストアモードは webview タグを含む', () => {
      require('../../src/renderer/tabs/store-recommend');
      const content = document.querySelector('#store-content');
      expect(content).not.toBeNull();
      expect(content.innerHTML).toContain('<webview');
      expect(content.innerHTML).toContain('store.steampowered.com');
    });

    test('ナビゲーションコントロールが存在する', () => {
      require('../../src/renderer/tabs/store-recommend');
      expect(document.getElementById('wv-back')).not.toBeNull();
      expect(document.getElementById('wv-forward')).not.toBeNull();
      expect(document.getElementById('wv-home')).not.toBeNull();
    });

    test('ページタイトル表示要素が存在する', () => {
      require('../../src/renderer/tabs/store-recommend');
      expect(document.getElementById('wv-title')).not.toBeNull();
    });

    test('価格バーコンテナが存在する', () => {
      require('../../src/renderer/tabs/store-recommend');
      expect(document.getElementById('wv-price-bar')).not.toBeNull();
    });
  });

  describe('URL pattern matching', () => {
    test('/app/12345 からappIdを抽出する', () => {
      const url = 'https://store.steampowered.com/app/12345/Some_Game/';
      const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
      expect(match).not.toBeNull();
      expect(match[1]).toBe('12345');
    });

    test('非アプリページではマッチしない', () => {
      const url = 'https://store.steampowered.com/search/?term=test';
      const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
      expect(match).toBeNull();
    });
  });
});
