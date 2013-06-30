/*
--------------------------------------------------------
glayer.js - (gray out + layer) = glayer
Version 2.2 (Update 2007/05/21)

- onozaty (http://www.enjoyxstudy.com)

Released under the Creative Commons License(Attribution 2.1 Japan):
 http://creativecommons.org/licenses/by/2.1/jp/

For details, see the web site:
 http://www.enjoyxstudy.com/javascript/glayer/

--------------------------------------------------------
*/

var Glayer = {
  defaultId : 'glayer',
  show: function(grayElement) {

    grayElement = this.createElement(grayElement || this.defaultId);
    this.resetSize(grayElement);
    grayElement.style.display = '';

    return grayElement;
  },
  hide: function(grayElement) {

    grayElement = this.getElement(grayElement || this.defaultId);
    grayElement.style.display = 'none';

    return grayElement;
  },
  fadeIn: function(grayElement, fadeOptions) {

    grayElement = this.createElement(grayElement || this.defaultId);
    this.resetSize(grayElement);

    fadeOptions = this.copyProperties({to: this.getOpacity(grayElement)}, fadeOptions || {});
    new Glayer.FadeIn(grayElement, fadeOptions).start();

    return grayElement;
  },
  fadeOut: function(grayElement, fadeOptions) {

    grayElement = this.getElement(grayElement || this.defaultId);

    fadeOptions = this.copyProperties({from: this.getOpacity(grayElement)}, fadeOptions || {});
    new Glayer.FadeOut(grayElement, fadeOptions).start();

    return grayElement;
  },

  showParallel: function(otherElements, grayElement) {

    grayElement = this.createElement(grayElement || this.defaultId);
    this.resetSize(grayElement);
    grayElement.style.display = '';

    for (var i = 0; i < otherElements.length; i++) {
      otherElements[i] = this.getElement(otherElements[i]);
      otherElements[i].style.display = '';
    }

    return grayElement;
  },
  hideParallel: function(otherElements, grayElement) {

    grayElement = this.getElement(grayElement || this.defaultId);
    grayElement.style.display = 'none';

    for (var i = 0; i < otherElements.length; i++) {
      otherElements[i] = this.getElement(otherElements[i]);
      otherElements[i].style.display = 'none';
    }

    return grayElement;
  },
  fadeInParallel: function(otherElements, grayElement, fadeOptions) {

    grayElement = this.createElement(grayElement || this.defaultId);
    this.resetSize(grayElement);

    fadeOptions = this.copyProperties({to: this.getOpacity(grayElement)}, fadeOptions || {});
    var grayFade = new Glayer.FadeIn(grayElement, fadeOptions);

    var otherFades = [];
    for (var i = 0; i < otherElements.length; i++) {
      otherElements[i] = this.getElement(otherElements[i]);
      otherFades.push(new Glayer.FadeIn(otherElements[i], {duration: fadeOptions.duration, to: this.getOpacity(otherElements[i])}));
    }

    grayFade.start(function(){
                     grayFade.update();
                     for (var i = 0; i < otherFades.length; i++) {
                       otherFades[i].update();
                     }
                   });

    return grayElement;
  },
  fadeOutParallel: function(otherElements, grayElement, fadeOptions) {

    grayElement = this.getElement(grayElement || this.defaultId);

    fadeOptions = this.copyProperties({from: this.getOpacity(grayElement)}, fadeOptions || {});
    var grayFade = new Glayer.FadeOut(grayElement, fadeOptions);

    var otherFades = [];
    for (var i = 0; i < otherElements.length; i++) {
      otherElements[i] = this.getElement(otherElements[i]);
      otherFades.push(new Glayer.FadeOut(otherElements[i], {duration: fadeOptions.duration, from: this.getOpacity(otherElements[i])}));
    }

    grayFade.start(function(){
                     grayFade.update();
                     for (var i = 0; i < otherFades.length; i++) {
                       otherFades[i].update();
                     }
                   });

    return grayElement;
  },

  resetSize: function(element) {
    var position = this._getStyle(element, 'position');

    if (position != 'fixed') {
      var page = this.getPageSize();

      element.style.width  = page.width + 'px';
      element.style.height = page.height + 'px';
    }
  },

  // Util
  getElement: function(element) {

    if (typeof element == 'string') {
      element = document.getElementById(element);
    }
    return element;
  },
  createElement: function(element) {

    var id = element;
    element = this.getElement(element);

    if (!element) {
      element = document.createElement('div');
      element.id = id;
      element.style.display = 'none';
      document.body.appendChild(element);
    }
    return element;
  },
  copyProperties: function(dest, src) {
    for (var property in src) {
      dest[property] = src[property];
    }
    return dest;
  },
  isIE : (/MSIE/.test(navigator.userAgent) && !window.opera),
  isWebKit : (navigator.userAgent.indexOf('AppleWebKit') != -1),

  // Window / Page Size
  getWindowSize: function() {
    var width;
    var height;

    if (document.compatMode == 'CSS1Compat' && !window.opera) {
      // Strict Mode && Non Opera
      width  = document.documentElement.clientWidth;
      height = document.documentElement.clientHeight;
    } else if (navigator.userAgent.indexOf('AppleWebKit') != -1){
      // Safari
      width  = window.innerWidth;
      height = window.innerHeight;
    } else {
      // other
      width  = document.body.clientWidth;
      height = document.body.clientHeight;
    }

    return {width: width, height: height};
  },
  getPageSize: function() {

    var windowSize = this.getWindowSize();

    var width  = windowSize.width;
    var height = windowSize.height;

    if (document.compatMode == 'CSS1Compat') {
      if (document.documentElement.scrollWidth > width) {
        width  = document.documentElement.scrollWidth;
      }
      if (document.documentElement.scrollHeight > height) {
        height = document.documentElement.scrollHeight;
      }
    } else {
      if (document.body.scrollWidth > width) {
        width  = document.body.scrollWidth;
      }
      if (document.body.scrollHeight > height) {
        height = document.body.scrollHeight;
      }
    }

    return {width: width, height: height};
  },

  // Styles
  getOpacity: function(element) {
    var value = this._getStyle(element, 'opacity');
    if (value) return parseFloat(value);

    if (value = (element.style.filter || '').match(/alpha\(opacity=(.*)\)/)) {
      if (value[1]) return parseFloat(value[1]) / 100;
    }

    return 1.0;
  },
  _getStyle: function(element, style) {
    var value = element.style[style];
    if (value) return value;

    if (document.defaultView && document.defaultView.getComputedStyle) {
      var oldDisplay = element.style.display;
      if (Glayer.isWebKit) element.style.display = 'block';
      var css = document.defaultView.getComputedStyle(element, null);
      if (css) value = css.getPropertyValue(style);
      if (Glayer.isWebKit) element.style.display = oldDisplay;
      return value;
    } else if (element.currentStyle) {
      return element.currentStyle[style];
    }

    return null;
  },

  // debug
  getDebugInfo: function() {

    var debugInfo = new Array();

    debugInfo.push("document.compatMode:" + document.compatMode);
    debugInfo.push("window.innerWidth:" + window.innerWidth);
    debugInfo.push("window.innerHeight:" + window.innerHeight);
    debugInfo.push("window.scrollMaxX:" + window.scrollMaxX);
    debugInfo.push("window.scrollMaxY:" + window.scrollMaxY);
    debugInfo.push("document.body.scrollWidth:" + document.body.scrollWidth);
    debugInfo.push("document.body.scrollHeight:" + document.body.scrollHeight);
    debugInfo.push("document.body.offsetWidth:" + document.body.offsetWidth);
    debugInfo.push("document.body.offsetHeight:" + document.body.offsetHeight);
    debugInfo.push("document.body.clientWidth:" + document.body.clientWidth);
    debugInfo.push("document.body.clientHeight:" + document.body.clientHeight);
    debugInfo.push("document.documentElement:" + document.documentElement);
    if (document.documentElement) {
      debugInfo.push("document.documentElement.scrollWidth:" + document.documentElement.scrollWidth);
      debugInfo.push("document.documentElement.scrollHeight:" + document.documentElement.scrollHeight);
      debugInfo.push("document.documentElement.offsetWidth:" + document.documentElement.offsetWidth);
      debugInfo.push("document.documentElement.offsetHeight:" + document.documentElement.offsetHeight);
      debugInfo.push("document.documentElement.clientWidth:" + document.documentElement.clientWidth);
      debugInfo.push("document.documentElement.clientHeight:" + document.documentElement.clientHeight);
    }

    return debugInfo;
  }
};


// Fade In/Out
Glayer.Fade = function(element, options) {
  this.setup(element, options);
};

Glayer.Fade.prototype = {
  intervalTime: 10,
  duration: 800,

  setup: function(element, options) {
    this.element = element;
    this.style = this.element.style;

    options = options || {};

    if (options.duration != undefined) this.duration = options.duration;
    if (options.from != undefined) this.from = options.from;
    if (options.to != undefined) this.to = options.to;
    if (options.callback != undefined) this.callback = options.callback;

    this.startTime = new Date().getTime();
    this.endTime = this.startTime + this.duration;

    this.range = this.to - this.from;

    if (Glayer.isIE && (!this.element.currentStyle.hasLayout)) {
      this.style['zoom'] = 1;
    }
    this.first = true;
  },
  start: function(updater) {
    var self = this;
    updater = updater || function(){ self.update(); };
    this.intervalId = setInterval(updater, this.intervalTime);
  },
  end: function() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.execCallback();
  },
  execCallback: function() {
    if (!this.callback) return;

    if (typeof this.callback == 'function') {
      this.callback();
    } else {
      for (var i = 0; i < this.callback.length; i++) {
        this.callback[i]();
      }
    }
  },
  update: function() {
    var nowTime = new Date().getTime();

    if (this.first) { 
      this.style.display = '';
      this.first = false;
    }

    if (nowTime >= this.endTime) {
      this.setOpacity(this.to);
      this.end();
    } else {
      this.setOpacity(this.from + (this.range * (nowTime - this.startTime) / this.duration));
    }
  },
  setOpacity: function(opacity) {
    this.style.opacity = opacity;
    if (Glayer.isIE) this.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
  }
};

Glayer.FadeIn = function() {
  Glayer.Fade.apply(this, arguments);
};
Glayer.copyProperties(Glayer.FadeIn.prototype, Glayer.Fade.prototype);
Glayer.FadeIn.prototype.from = 0.0;
Glayer.FadeIn.prototype.to = 1.0;

Glayer.FadeOut = function() {
  Glayer.Fade.apply(this, arguments);
};
Glayer.copyProperties(Glayer.FadeOut.prototype, Glayer.Fade.prototype);
Glayer.FadeOut.prototype.from = 1.0;
Glayer.FadeOut.prototype.to = 0.0;
Glayer.FadeOut.prototype.end = function() {
  this.style.display = 'none';
  this.setOpacity(this.from);
  Glayer.Fade.prototype.end.apply(this, arguments);
};

