/*
--------------------------------------------------------
glayer_ex.js (glayer.js extensions)
Version 1.0 (Update 2007/05/28)

- onozaty (http://www.enjoyxstudy.com)

Released under the Creative Commons License(Attribution 2.1 Japan):
 http://creativecommons.org/licenses/by/2.1/jp/

For details, see the web site:
 http://www.enjoyxstudy.com/javascript/glayer/extension/
 http://www.enjoyxstudy.com/javascript/glayer/

--------------------------------------------------------
*/
Glayer.copyProperties(Glayer, {
  //// Base ////
  boxClassName: 'glayer_box',
  createBox: function(boxElement) {
    boxElement = this.createElement(boxElement);
    boxElement.className = this.boxClassName;
    return boxElement;
  },
  showBox: function(boxElement, boxOptions, grayElement) {
    this.setBoxPosition(boxElement, boxOptions);
    return this.showParallel([boxElement], grayElement);
  },
  hideBox: function(boxElement, grayElement) {
    return this.hideParallel([boxElement], grayElement);
  },
  fadeInBox: function(boxElement, boxOptions, grayElement, fadeOption) {
    this.setBoxPosition(boxElement, boxOptions);
    return this.fadeInParallel([boxElement], grayElement, fadeOption);
  },
  fadeOutBox: function(boxElement, grayElement, fadeOption) {
    return this.fadeOutParallel([boxElement], grayElement, fadeOption);
  },

  setBoxPosition: function(boxElement, boxOptions) {
    var style = boxElement.style;

    boxOptions = boxOptions || {};
    var topRatio = boxOptions.topRatio != null ? boxOptions.topRatio : 0.5;
    var leftRatio = boxOptions.leftRatio != null ? boxOptions.leftRatio : 0.5;
    style.width = boxOptions.width || '';
    style.height = boxOptions.height || '';

    var windowTop = 0;
    var windowLeft = 0;
    var position = this._getStyle(boxElement, 'position');
    if (position != 'fixed') {
      windowTop = document.documentElement.scrollTop || document.body.scrollTop;
      windowLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    }

    style.display = '';
    var offsetHeight = boxElement.offsetHeight;
    var offsetWidth = boxElement.offsetWidth;
    style.display = 'none';

    var windowSize = this.getWindowSize();

    style.top = ((windowSize.height * topRatio) - (offsetHeight * topRatio) + windowTop) + 'px';
    style.left = ((windowSize.width * leftRatio) - (offsetWidth * leftRatio) + windowLeft) + 'px';
  },

  //// Message ////
  defaultMessage: {
    boxId: 'glayer_message',
    textId: 'glayer_message_text'
  },
  createMessageBox: function(message, boxOptions) {
    boxOptions = boxOptions || {};
    var boxElement = boxOptions.box || this.defaultMessage.boxId;
    var boxId = boxElement.id || boxElement;
    var textElement = boxOptions.text || this.defaultMessage.textId;
    var textId = textElement.id || textElement;

    boxElement = this.getElement(boxElement);
    if (!boxElement) {
      boxElement = this.createBox(boxId);
      textElement = document.createElement('p');
      textElement.id = textId;
      boxElement.appendChild(textElement);
    } else {
      textElement = this.getElement(textElement);
    }

    textElement.innerHTML = message;
    return boxElement;
  },

  showMessage: function(message, boxOptions, grayElement) {
    return this.showBox(this.createMessageBox(message, boxOptions), boxOptions, grayElement);
  },
  hideMessage: function(boxElement, grayElement) {
    return this.hideBox(boxElement || this.defaultMessage.boxId, grayElement);
  },
  fadeInMessage: function(message, boxOptions, grayElement, fadeOption) {
    return this.fadeInBox(this.createMessageBox(message, boxOptions), boxOptions, grayElement, fadeOption);
  },
  fadeOutMessage: function(boxElement, grayElement, fadeOption) {
    return this.fadeOutBox(boxElement || this.defaultMessage.boxId, grayElement, fadeOption);
  },

  //// Alert ////
  defaultAlert: {
    boxId: 'glayer_alert',
    textId: 'glayer_alert_text',
    buttonId: 'glayer_alert_button',
    okId: 'glayer_alert_ok',
    okLabel: 'OK'
  },
  getDefaultAlertOkFunc: function() {
    return function(){ Glayer.hideAlert(); };
  },

  createAlertBox: function(message, boxOptions) {

    boxOptions = boxOptions || {};
    var boxElement = boxOptions.box || this.defaultAlert.boxId;
    var boxId = boxElement.id || boxElement;
    var textElement = boxOptions.text || this.defaultAlert.textId;
    var textId = textElement.id || textElement;
    var okElement = boxOptions.ok || this.defaultAlert.okId;
    var okId = okElement.id || okElement;

    boxElement = this.getElement(boxElement);
    if (!boxElement) {
      boxElement = this.createBox(boxId);

      textElement = document.createElement('p');
      textElement.id = textId;
      boxElement.appendChild(textElement);

      var buttonElement = document.createElement('p');
      buttonElement.id = this.defaultAlert.buttonId;
      boxElement.appendChild(buttonElement);

      okElement = document.createElement('input');
      okElement.type = 'button';
      okElement.id = okId;
      buttonElement.appendChild(okElement);
    } else {
      textElement = this.getElement(textElement);
      okElement = this.getElement(okElement);
    }

    textElement.innerHTML = message;

    okElement.value = boxOptions.okLabel || this.defaultAlert.okLabel;
    okElement.onclick = boxOptions.callback || this.getDefaultAlertOkFunc();

    return boxElement;
  },

  showAlert: function(message, boxOptions, grayElement) {
    return this.showBox(this.createAlertBox(message, boxOptions), boxOptions, grayElement);
  },
  hideAlert: function(boxElement, grayElement) {
    return this.hideBox(boxElement || this.defaultAlert.boxId, grayElement);
  },
  fadeInAlert: function(message, boxOptions, grayElement, fadeOption) {
    return this.fadeInBox(this.createAlertBox(message, boxOptions), boxOptions, grayElement, fadeOption);
  },
  fadeOutAlert: function(boxElement, grayElement, fadeOption) {
    return this.fadeOutBox(boxElement || this.defaultAlert.boxId, grayElement, fadeOption);
  },

  //// Confirm ////
  defaultConfirm: {
    boxId: 'glayer_confirm',
    textId: 'glayer_confirm_text',
    buttonId: 'glayer_confirm_button',
    okId: 'glayer_confirm_ok',
    okLabel: 'OK',
    cancelId: 'glayer_confirm_cancel',
    cancelLabel: 'Cancel'
  },
  getConfirmResultFunc: function(callback, result) {
    return function(){ callback(result); };
  },

  createConfirmBox: function(message, resultCallback, boxOptions) {

    boxOptions = boxOptions || {};
    var boxElement = boxOptions.box || this.defaultConfirm.boxId;
    var boxId = boxElement.id || boxElement;
    var textElement = boxOptions.text || this.defaultConfirm.textId;
    var textId = textElement.id || textElement;
    var okElement = boxOptions.ok || this.defaultConfirm.okId;
    var okId = okElement.id || okElement;
    var cancelElement = boxOptions.cancel || this.defaultConfirm.cancelId;
    var cancelId = cancelElement.id || cancelElement;

    boxElement = this.getElement(boxElement);
    if (!boxElement) {
      boxElement = this.createBox(boxId);

      textElement = document.createElement('p');
      textElement.id = textId;
      boxElement.appendChild(textElement);

      var buttonElement = document.createElement('p');
      buttonElement.id = this.defaultConfirm.buttonId;
      boxElement.appendChild(buttonElement);

      okElement = document.createElement('input');
      okElement.type = 'button';
      okElement.id = okId;
      buttonElement.appendChild(okElement);
      cancelElement = document.createElement('input');
      cancelElement.type = 'button';
      cancelElement.id = cancelId;
      buttonElement.appendChild(cancelElement);
    } else {
      textElement = this.getElement(textElement);
      okElement = this.getElement(okElement);
      cancelElement = this.getElement(cancelElement);
    }

    textElement.innerHTML = message;

    okElement.value = boxOptions.okLabel || this.defaultConfirm.okLabel;
    okElement.onclick = this.getConfirmResultFunc(resultCallback, true);

    cancelElement.value = boxOptions.cancelLabel || this.defaultConfirm.cancelLabel;
    cancelElement.onclick = this.getConfirmResultFunc(resultCallback, false);

    return boxElement;
  },

  showConfirm: function(message, resultCallback, boxOptions, grayElement) {
    return this.showBox(this.createConfirmBox(message, resultCallback, boxOptions), boxOptions, grayElement);
  },
  hideConfirm: function(boxElement, grayElement) {
    return this.hideBox(boxElement || this.defaultConfirm.boxId, grayElement);
  },
  fadeInConfirm: function(message, resultCallback, boxOptions, grayElement, fadeOption) {
    return this.fadeInBox(this.createConfirmBox(message, resultCallback, boxOptions), boxOptions, grayElement, fadeOption);
  },
  fadeOutConfirm: function(boxElement, grayElement, fadeOption) {
    return this.fadeOutBox(boxElement || this.defaultConfirm.boxId, grayElement, fadeOption);
  }
});
