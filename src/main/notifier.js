'use strict';

const { Notification } = require('electron');

/**
 * トースト通知を発行する
 * @param {{ title: string, body: string, onClick?: Function }} options
 */
function notify({ title, body, onClick }) {
  const notification = new Notification({ title, body });
  if (onClick) {
    notification.on('click', onClick);
  }
  notification.show();
  return notification;
}

/**
 * セール通知を発行する
 * @param {Game} game
 * @param {number} discountRate
 */
function notifySale(game, discountRate) {
  return notify({
    title: `${game.title} がセール中!`,
    body: `${discountRate}% OFF — ¥${game.currentPrice}`,
  });
}

module.exports = { notify, notifySale };
