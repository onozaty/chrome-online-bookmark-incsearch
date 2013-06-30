var IncSearch = function() {
  this.initialize.apply(this, arguments);
};

/*-- Utils --------------------------------------------*/
IncSearch._copyProperties = function(dest, src) {
  for (var property in src) {
    dest[property] = src[property];
  }
  return dest;
};

IncSearch._copyProperties = function(dest, src) {
  for (var property in src) {
    dest[property] = src[property];
  }
  return dest;
};

IncSearch._getElement = function(element) {
  return (typeof element == 'string') ? document.getElementById(element) : element;
};

IncSearch._addEvent = function(element, type, func) {
  element.addEventListener(type, func, false);
};

IncSearch._stopEvent = function(event) {
  event.preventDefault();
  event.stopPropagation();
};

/*-----------------------------------------------------*/
IncSearch.prototype = {
  initialize: function(input, viewArea) {
    this.input = IncSearch._getElement(input);
    this.viewArea = IncSearch._getElement(viewArea);

    this.checkLoopTimer = null;
    this.setOptions(arguments[2] || {});

    this.reset();

    // check loop start
    this.checkLoop();
  },

  reset: function() {
    this.oldInput = null;
    this.results = null;
    this.resultCount = null;

    this.nowPage = 0;
    this.nowRow = 0;

    this.resetTotalCount();
  },

  // options
  interval: 500,
  delay: 0,
  dispMax: 10,
  initDispNon: false,
  ignoreCase: true,
  highlight: true,
  highClassName: 'high',
  highClassNum: 4,
  delim: ' ',
  escape: true,
  pagePrevName: 'prev',
  pageNextName: 'next',
  useHotkey: true,
  urlTarget: '_blank',
  editTarget: '_blank',

  startElementText: '<table><tr><th></th><th width="60%">Description</th><th width="20%">Tags</th><th width="20%">Time</th><th></th>',

  setOptions: function(options) {

    IncSearch._copyProperties(this, options);

    if (this.useHotkey) {
      IncSearch._addEvent(document, 'keydown', this._bindEvent(this.hotkey));
    }
  },

  checkLoop: function() {
    var input = this.getInput();
    if (this.isChange(input)) {
      this.oldInput = input;
      if (this.delay == 0) {
        this.startSearch(input);
      } else {
        if (this.startSearchTimer) clearTimeout(this.startSearchTimer);
        this.startSearchTimer = setTimeout(this._bind(this.startSearch, input), this.delay);
      }
    }
    if (this.checkLoopTimer) clearTimeout(this.checkLoopTimer);
    this.checkLoopTimer = setTimeout(this._bind(this.checkLoop), this.interval);
  },

  isChange: function(input) {
    return (!this.oldInput || (input.join(this.delim) != this.oldInput.join(this.delim)));
  },

  startSearch: function(input) {
    // init
    this.clearViewArea();
    if (!this.initDispNon || input.length != 0) {
      if (this.searchBefore) this.searchBefore();
      this.count(input, this._bind(function() {
        this.search(input, 1, this._bind(function() {
          this.createViewArea(input);
          this.nowPage = 1;
          this.changeRow(1);
          this.createPageLink(1, this.pageLinkTop);
          this.createPageLink(1, this.pageLinkBottom);
          if (this.searchAfter) this.searchAfter();
        }));
      }));
    }
  },
  changePage: function(pageNo, callback) {

    var start = (pageNo - 1) * this.dispMax + 1;

    if (start > this.resultCount) return false;

    if (this.changePageBefore) this.changePageBefore(pageNo);
    this.search(this.oldInput, start, this._bind(function() {
      this.createViewArea(this.oldInput);
      this.nowPage = pageNo;
      this.nowRow = 0;
      this.changeRow(1);
      this.createPageLink(pageNo, this.pageLinkTop);
      this.createPageLink(pageNo, this.pageLinkBottom);
      if (this.changePageAfter) this.changePageAfter(pageNo);
      if (callback) callback();
    }));
  },
  changeRow: function(rowNo) {

    if (this.results.length == 0) {
      return;
    }

    if (rowNo < 1) {
      if (this.nowPage > 1) {
        this.changePage(this.nowPage - 1, this._bind(function() {
          this.changeRow(this.results.length);
        }));
      }
      return;
    }

    if (rowNo > this.results.length) {
      if (this.nowPage < this.getPageCount()) {
        this.changePage(this.nowPage + 1);
      }
      return;
    }

    var table = this.viewArea.getElementsByTagName('table')[0];

    if (this.nowRow != 0 && table.rows[this.nowRow]) {
      table.rows[this.nowRow].className = '';
    }
    var row = table.rows[rowNo];
    row.className = 'focus';

    var margin = 0;
    var topPos = (this.viewArea.offsetTop + row.offsetTop) - (this.viewArea.offsetTop + table.rows[1].offsetTop);
    var bottomPos = (this.viewArea.offsetTop + row.offsetTop + row.offsetHeight) + 5;

    if (topPos < document.documentElement.scrollTop) {
      window.scrollTo(0, topPos);
    } else if (bottomPos > document.documentElement.clientHeight + document.documentElement.scrollTop) {
      window.scrollTo(0, bottomPos - document.documentElement.clientHeight);
    }

    this.nowRow = rowNo;
  },
  openUrl: function(rowNo) {

    if (this.results.length == 0) {
      return;
    }

    window.open(this.results.item(rowNo - 1).url, this.urlTarget);
  },
  openEditWindow: function(rowNo) {

    if (this.results.length == 0) {
      return;
    }

    window.open(this.createEditUrl(this.results.item(rowNo - 1)), this.editTarget);
  },

  countSql: 'SELECT COUNT(*) count FROM bookmark',
  resetTotalCount: function(callback) {

    var self = this;
    this.database.transaction({
      sql: this.countSql,
      callback: function(tx, result) {
        self.totalCount = result.rows.item(0)["count"];
      }
    }).
    success(function() {
      if (callback) callback();
    }).
    start();
  },

  count: function(patternList, callback) {
    var where = this.createWhere(patternList);

    var self = this;
    this.database.transaction({
      sql: this.countSql + where.where,
      params: where.params,
      callback: function(tx, result) {
        self.resultCount = result.rows.item(0)["count"];
      }
    }).
    success(function() {
      if (callback) callback();
    }).
    start();
  },

  searchSql: 'SELECT url, title, info, tags, time FROM bookmark',
  search: function(patternList, start, callback) {

    var where = this.createWhere(patternList);
    var sql = [
       this.searchSql, where.where,
       ' ORDER BY id',
       ' LIMIT ', this.dispMax, 
       ' OFFSET ', (start - 1)].join('');

    var self = this;
    this.database.transaction({
      sql: sql,
      params: where.params,
      callback: function(tx, result) {
        self.results = result.rows;
      }
    }).
    success(function() {
      if (callback) callback();
    }).
    start();
  },
  createWhere: function(patternList) {

    var where = [];
    var params = [];

    if (patternList.length != 0) {
      for (var i = 0, len = patternList.length; i < len; i++) {
        var temp = this.createCondOne(patternList[i], params, i);
        if (temp != '') {
          if (where.length != 0) where.push(' AND');
          where.push(temp);
        }
      }
    }

    var whereString = where.join('');
    if (whereString.length > 0) whereString = ' WHERE' + whereString;

    return {
      where: whereString,
      params: params};
  },
  createCondOne: function(pattern, params) {

    var where = [];
    if (pattern.indexOf('|') > -1) {
      var patterns = this.getSplitPatterns(pattern, '|');
      if (patterns.length != 0) {
        for (var i = 0, len = patterns.length; i < len; i++) {
          var temp = this.createCondOne(patterns[i], params);
          if (temp != '') {
            if (where.length != 0) where.push(' OR');
            where.push(temp);
          }
        }
        if (where.length != 0) {
          where.unshift(' (');
          where.push(')');
        }
      }
    } else if (pattern.indexOf('!') == 0) {
      if (pattern.length != 1) {
        where.push(this._createCondOne(pattern.substr(1), params, true));
      }
    } else {
      where.push(this._createCondOne(pattern, params));
    }
    return where.join('');
  },
  _createCondOne: function(pattern, params, not) {
    params.push(['%', pattern.toUpperCase().replace(/\\/g, '\\\\').replace(/\%/g, '\\%').replace(/\_/g, '\\_'), '%'].join(''));
    return [" search_text ", (not ? "NOT " : ""), "LIKE ", "?", " ESCAPE '\\'"].join('');
  },

  getSplitPatterns: function(pattern, separator) {
    var temp = pattern.split(separator);
    var patterns = [];
    for (var i = 0, len = temp.length; i < len; i++) {
      if (temp[i] != '') patterns.push(temp[i]);
    }
    return patterns;
  },

  createPageLink: function(pageNo, pageLinkElm) {

    pageLinkElm = IncSearch._getElement(pageLinkElm);

    var pageCount = this.getPageCount();

    var prev_page = false;
    var next_page = false;

    if (pageCount > 1) {

      if (pageNo == 1) {
        next_page = true;
      } else if (pageNo == pageCount) {
        prev_page = true;
      } else {
        next_page = true;
        prev_page = true;
      }
    }

    pageLinkElm.innerHTML = '';

    if (prev_page) {
      this.createPageAnchor(pageLinkElm, this.pagePrevName, pageNo - 1);
    }
    if (next_page) {
      if (prev_page) {
        pageLinkElm.appendChild(document.createTextNode(' | '));
      }

      this.createPageAnchor(pageLinkElm, this.pageNextName, pageNo + 1);
    }
  },

  createPageAnchor: function(parent, text, page) {

    var a = parent.appendChild(document.createElement('a'));
    a.setAttribute('href', 'javascript:void(0)');
    a.appendChild(document.createTextNode(text));

    IncSearch._addEvent(a, 'click', this._bind(this.changePage, page));
  },

  getPageCount: function() {
    var pageCount = 0;

    if (this.resultCount && this.resultCount != 0) {
      if (this.dispMax == 0) {
        pageCount = 1;
      } else {
        pageCount = Math.floor((this.resultCount + this.dispMax - 1) / this.dispMax);
      }
    }
    return pageCount;
  },

  createInfo: function() {
    var displayInfo = '';

    if (this.resultCount != 0) {
      var start = (this.nowPage - 1) * this.dispMax + 1;
      var end   = start + this.dispMax - 1;

      if (this.dispMax == 0 || end > this.resultCount) {
        end = this.resultCount;
      }
      displayInfo = ['(display :', start, '-', end, ')'].join('');
    }
    this.status.innerHTML = [this.resultCount.toString(), ' hits ',
                             displayInfo, ' / total : ', this.totalCount].join('');
  },
  searchAfter: function() {
    this.createInfo();
    window.scrollTo(0, 0);
  },
  searchBefore: function() {
    this.status.innerHTML = 'Search...';
  },
  changePageAfter: function(pageNo) {
    this.createInfo();
    window.scrollTo(0, 0);
  },

  hotkey: function(event) {
    if (event.ctrlKey) {
      switch(event.keyCode) {
        case 13:  // Enter
        case 77:  // m (Enter Max OS X)
          this.openUrl(this.nowRow);
          IncSearch._stopEvent(event);
          break;
        case 37:  // Left
          if (this.nowPage > 1) {
            this.changePage(this.nowPage - 1);
          }
          IncSearch._stopEvent(event);
          break;
        case 38:  // Up
          this.changeRow(this.nowRow - 1);
          IncSearch._stopEvent(event);
          break;
        case 39:  // Right
          if (this.nowPage < this.getPageCount()) {
            this.changePage(this.nowPage + 1);
          }
          IncSearch._stopEvent(event);
          break;
        case 40:  // Down
          this.changeRow(this.nowRow + 1);
          IncSearch._stopEvent(event);
          break;
        case 69:  // e
          this.openEditWindow(this.nowRow);
          IncSearch._stopEvent(event);
          break;
        default:
          break;
      }
    }
  },

  createViewArea: function(patternList) {
    var elementText = [];

    patternList = this.getHighlightPatterns(patternList);

    for (var i = 0, len = this.results.length; i < len; i++) {
      elementText.push(this.createLineElement(this.results.item(i), patternList));
    }

    if (elementText.length > 0) {
      if (this.startElementText) elementText.unshift(this.startElementText);
      if (this.endElementText) elementText.push(this.endElementText);
      this.viewArea.innerHTML = elementText.join('');
    }

    if (this.afterHookCreateView) {
      this.afterHookCreateView(patternList);
    }
  },

  getHighlightPatterns: function(patternList) {
    var highlightPatterns = [];

    for (var i = 0, len = patternList.length; i < len; i++) {
      var pattern = patternList[i];
      if (pattern.indexOf('|') > -1) {
        var patterns = this.getSplitPatterns(pattern, '|');
        highlightPatterns = highlightPatterns.concat(this.getHighlightPatterns(patterns));
      } else if (pattern.indexOf('!') != 0) {
        highlightPatterns.push(pattern);
      }
    }
    return highlightPatterns;
  },

  clearViewArea: function() {
    this.viewArea.innerHTML = '';
    this.results = null;
    this.resultCount = null;
    this.nowPage = 0;
    this.nowRow = 0;
  },

  createLineElement: function(bookmark, patternList) {

    var text = ['<tr><td></td><td>'];

    // url, title
    text.push(this.createTitleElement(bookmark, patternList));

    // info
    if (bookmark.info) {
      text.push(this.createElement(bookmark.info, patternList, 'p'));
    }
    text.push('</td>');

    // tags
    text.push(this.createElement(this.tagsString(bookmark.tags), patternList, 'td'));

    // time
    text.push(this.createElement(bookmark.time, patternList, 'td', false));

    // edit
    text.push(this.createEditElement(bookmark, patternList));
    text.push('</tr>');

    return text.join('');
  },

  createElement: function(value, patternList, tagName, highlight) {

    return ['<', tagName, '>',
            this.createText(value, patternList, highlight),
            '</', tagName, '>'].join('');
  },

  createText: function(value, patternList, highlight) {

    var textList = [];

    if (highlight == null) highlight = this.highlight;

    if (highlight) {

      var first = this.getFirstMatch(value, patternList);

      while (first.listIndex != -1) {
        textList.push(this._escapeHTML(value.substr(0, first.matchIndex)));
        textList.push('<strong class="');
        textList.push(this.highClassName);
        textList.push((first.listIndex % this.highClassNum) + 1);
        textList.push('">');
        textList.push(this._escapeHTML(value.substr(first.matchIndex, patternList[first.listIndex].length)));
        textList.push('</strong>');

        value = value.substr(first.matchIndex + patternList[first.listIndex].length);
        first = this.getFirstMatch(value, patternList);
      }
    }

    textList.push(this._escapeHTML(value));

    return textList.join('');
  },

  tagsString: function(tags, sep) {

    if (typeof(tags) == 'string') return tags;

    sep = sep || ' ';
    if (this.tagBracket && tags.length != 0) {
      return ['[', tags.join(']' + sep + '['), ']'].join('');
    } else {
      return tags.join(sep);
    }
  },

  createTitleElement: function(bookmark, patternList) {
    var text = ['<a href="',  bookmark.url, '"'];
    if (this.urlTarget) {
      text.push(' target="', this.urlTarget, '" ');
    }
    text.push('>');
    text.push(this.createText(bookmark.title, patternList));
    text.push('</a>');

    if (this.addTitleText) {
      text.push(this.addTitleText(bookmark, patternList));
    }

    text.push('<br />');
    return text.join('');
  },

  createEditElement: function(bookmark, patternList) {

    var text = ['<td><a href="',  this.createEditUrl(bookmark), '"'];
    if (this.editTarget) {
      text.push(' target="', this.editTarget, '" ');
    }

    text.push('>edit</a></td>');

    return text.join('');
  },

  matchIndex: function(value, pattern) {

    if (this.ignoreCase) {
      return value.toLowerCase().indexOf(pattern.toLowerCase());
    } else {
      return value.indexOf(pattern);
    }
  },

  getFirstMatch: function(value, patternList) {

    var first = {};
    first.listIndex = -1;
    first.matchIndex = value.length;

    for (var i = 0, len = patternList.length; i < len; i++) {
      var index = this.matchIndex(value, patternList[i]);
      if (index != -1 && index < first.matchIndex) {
        first.listIndex = i;
        first.matchIndex = index;
      }
    }

    return first;
  },

  getInput: function() {

    var value = this.input.value;

    if (!value) {
      return [];
    } else if (this.delim) {
      var list = value.split(this.delim);
      var inputs = [];
      for (var i = 0, len = list.length; i < len; i++) {
        if (list[i]) inputs.push(list[i]);
      }
      return inputs;
    } else {
      return [value];
    }
  },

  // Utils
  _bind: function(func) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return function(){ func.apply(self, args); };
  },
  _bindEvent: function(func) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return function(event){ event = event || window.event; func.apply(self, [event].concat(args)); };
  },
  _escapeHTML: function(value) {
    if (this.escape) {
      return value.replace(/\&/g, '&amp;').replace( /</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;').replace(/\'/g, '&#39;').replace(/\n|\r\n/g, '<br />');
    } else {
      return value;
    }
  }
}
