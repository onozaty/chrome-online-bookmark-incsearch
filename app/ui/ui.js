const NUMBER_FORMAT = new Intl.NumberFormat();
const format = (num) => {
  return NUMBER_FORMAT.format(num);
}

class SearchableTable {
  constructor(bookmarks, numberOfPage, service, elements) {

    this._bookmarks = new Bookmarks(bookmarks);
    this._numberOfPage = numberOfPage;
    this._service = service;
    this._elements = elements;

    this._setup();
  }

  _setup() {

    this._elements.$pagerPrev.on('click', this._prevPage.bind(this));
    this._elements.$pagerNext.on('click', this._nextPage.bind(this));

    this._results = this._bookmarks.all();

    this._showResults();
    this._checkQueryLoop();
  }

  _checkQueryLoop() {

    if (this._checkQueryLoopTimer) {
      clearTimeout(this._checkQueryLoopTimer);
    }

    const query = this._elements.$query.val().trim();
    if (query != this._oldQuery) {
      this._oldQuery = query;
      this._search(query);
    }

    this._checkQueryLoopTimer = setTimeout(this._checkQueryLoop.bind(this), 500);
  }

  _search(query) {

    if (query.length == 0) {
      this._results = this._bookmarks.all();
    } else {
      const conditions = new Conditions(query);
      this._results = this._bookmarks.find(conditions);
    }

    this._showResults();
  }

  _nextPage() {
    this._showResults(this._currentPageNo + 1);
  }

  _prevPage() {
    this._showResults(this._currentPageNo - 1);
  }

  _showResults(pageNo) {
    pageNo = pageNo || 1;

    this._currentPageNo = pageNo;
    const start = (pageNo - 1) * this._numberOfPage + 1;
    var end = start + this._numberOfPage - 1;
    if (end > this._results.length) {
      end = this._results.length;
    }
    
    const pageResults = this._results.slice(start - 1, end);
    this._renderTableBody(pageResults);

    this._elements.$status.text(this._createStatusText(start, end));

    if (start > 1) {
      this._elements.$pagerPrev.show();
    } else {
      this._elements.$pagerPrev.hide();
    }

    if (end < this._results.length) {
      this._elements.$pagerNext.show();
    } else {
      this._elements.$pagerNext.hide();
    }
  }

  _createStatusText(start, end) {
    return `${format(this._results.length)} hits (display: ${format(start)}-${format(end)}) / total: ${format(this._bookmarks.total())}`;
  }

  _renderTableBody(pageResults) {
    this._elements.$resultTable.children().remove();

    for (const bookmark of pageResults) {
      this._elements.$resultTable.append(this._createRecord(bookmark))
    }
  }

  _createRecord(bookmark) {
    var parts = ['<tr><td></td>'];
    
    parts.push('<td>');
    parts.push(`<a href="${bookmark.url}" target="_blank">${this._createText(bookmark.title)}</a>`);

    if (bookmark.description) {
      parts.push(`<p>${this._createText(bookmark.description)}</p>`);
    }
    parts.push('</td>');

    parts.push(`<td>${this._createText(bookmark.tags)}</td>`);
    parts.push(`<td>${this._createText(bookmark.time)}</td>`);
    parts.push(`<td><a href="${this._service.createEditUrl(bookmark)}" target="_blank">edit</a></td>`);

    return parts.join('');
  }

  _createText(value) {
    return this._escapeHTML(value);
  }

  _escapeHTML(value) {
    return value
      .replace(/\&/g, '&amp;')
      .replace( /</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#39;')
      .replace(/\n|\r\n/g, '<br />');
  }
}

const searchableTable = new SearchableTable(
  createDummyBookmakrs(100000),
  10,
  {
    createEditUrl: function() {
      return '';
    }
  },
  {
    $query: $('#query'),
    $resultTable: $('#resultTable'),
    $status: $('#status'),
    $pagerPrev: $('button.pager-prev'),
    $pagerNext: $('button.pager-next')
  });
