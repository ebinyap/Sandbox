'use strict';

describe('renderer components', () => {
  beforeEach(() => {
    // IIFE がアクセスする window をグローバルに用意
    global.window = global.window || {};
    delete global.window.GameCard;
    delete global.window.PriceBar;
    // jest のモジュールキャッシュをクリア
    jest.resetModules();
  });

  afterEach(() => {
    delete global.window.GameCard;
    delete global.window.PriceBar;
  });

  describe('GameCard', () => {
    beforeEach(() => {
      require('../../src/renderer/components/game-card');
    });

    test('window.GameCard が登録される', () => {
      expect(global.window.GameCard).toBeDefined();
      expect(typeof global.window.GameCard.render).toBe('function');
    });

    test('タイトルと価格を表示する', () => {
      const html = global.window.GameCard.render({
        title: 'Skyrim',
        currentPrice: 9.99,
        playtimeMinutes: 6000,
        tags: ['RPG', 'Open World'],
      });
      expect(html).toContain('Skyrim');
      expect(html).toContain('$9.99');
      expect(html).toContain('100h');
      expect(html).toContain('RPG');
      expect(html).toContain('Open World');
    });

    test('タイトルがない場合は id を表示する', () => {
      const html = global.window.GameCard.render({ id: '12345' });
      expect(html).toContain('12345');
    });

    test('価格がない場合は -- を表示する', () => {
      const html = global.window.GameCard.render({ title: 'Test' });
      expect(html).toContain('--');
    });

    test('プレイ時間がない場合は -- を表示する', () => {
      const html = global.window.GameCard.render({ title: 'Test', playtimeMinutes: null });
      expect(html).toContain('Playtime: --');
    });

    test('スコアがある場合は表示する', () => {
      const html = global.window.GameCard.render({ title: 'Test', score: 8.5 });
      expect(html).toContain('Score: 8.5');
    });

    test('タグは最大5個まで表示する', () => {
      const tags = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      const html = global.window.GameCard.render({ title: 'Test', tags });
      expect(html).toContain('>A<');
      expect(html).toContain('>E<');
      expect(html).not.toContain('>F<');
    });
  });

  describe('PriceBar', () => {
    beforeEach(() => {
      require('../../src/renderer/components/price-bar');
    });

    test('window.PriceBar が登録される', () => {
      expect(global.window.PriceBar).toBeDefined();
      expect(typeof global.window.PriceBar.render).toBe('function');
    });

    test('null データは空文字を返す', () => {
      expect(global.window.PriceBar.render(null)).toBe('');
    });

    test('現在価格を表示する', () => {
      const html = global.window.PriceBar.render({ currentPrice: 29.99 });
      expect(html).toContain('Current: $29.99');
    });

    test('最安値を表示する', () => {
      const html = global.window.PriceBar.render({
        lowestPrice: 9.99,
        lowestStore: 'Steam',
      });
      expect(html).toContain('Lowest Now: $9.99 (Steam)');
    });

    test('歴代最安値を表示する', () => {
      const html = global.window.PriceBar.render({ historicalLow: 4.99 });
      expect(html).toContain('All-time Low: $4.99');
    });

    test('次回セール月を表示する', () => {
      const html = global.window.PriceBar.render({ nextSaleMonth: '2024-06' });
      expect(html).toContain('Next Sale: ~2024-06');
    });

    test('全フィールドを表示する', () => {
      const html = global.window.PriceBar.render({
        currentPrice: 59.99,
        lowestPrice: 29.99,
        lowestStore: 'Humble',
        historicalLow: 9.99,
        nextSaleMonth: '2024-12',
      });
      expect(html).toContain('Current: $59.99');
      expect(html).toContain('Lowest Now: $29.99 (Humble)');
      expect(html).toContain('All-time Low: $9.99');
      expect(html).toContain('Next Sale: ~2024-12');
    });
  });
});
