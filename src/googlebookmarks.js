var GoogleBookmarksParser = {
  parse: function(xml, idStart) {
    var items = xml.getElementsByTagName('item');

    var list = [];
    for (var i = 0, len = items.length; i < len; i++) {
      var bookmark = {};
      var item = items[i];

      bookmark.id = idStart + i;
      bookmark.url = this.getFirstText(item, 'link');
      bookmark.title = this.getFirstText(item, 'title');
      bookmark.info = this.getInfo(item);
      bookmark.tags = this.getTags(item);
      bookmark.time = this.getFirstText(item, 'pubDate');

      list.push(bookmark);
    }

    return list;
  },
  getInfo: function(item) {

    var annotation = item.getElementsByTagNameNS('http://www.google.com/history/', 'bkmk_annotation');
    return (annotation.length != 0) ? annotation[0].firstChild.nodeValue : '';
  },
  getTags: function(item) {

    var tags = item.getElementsByTagNameNS('http://www.google.com/history/', 'bkmk_label');

    var tagsList = [];
    for (var i = 0, len = tags.length; i < len; i++) {
      tagsList.push(tags[i].firstChild.nodeValue);
    }

    if (tagsList.length == 0) {
      return '';
    }
    return '[' + tagsList.join('] [') + ']';
  },
  getFirstText: function(element, tagName) {
    var firstChild = element.getElementsByTagName(tagName)[0].firstChild;
    return (firstChild) ? firstChild.nodeValue : '';
  }
}


var GoogleBookmarksLoader = function(statusElement, loadingElement, database, callback) {
  this.init(statusElement, loadingElement, database, callback);
};

for (var prop in LoaderBase.prototype) {
  GoogleBookmarksLoader.prototype[prop] = LoaderBase.prototype[prop];
}

GoogleBookmarksLoader.prototype.url = 'https://www.google.com/bookmarks/lookup?output=rss&sort=date';
GoogleBookmarksLoader.COLLECT_SIZE = 1000;

GoogleBookmarksLoader.prototype._load = function() {
  this.bookmarks = [];
  this.__load();
}
GoogleBookmarksLoader.prototype.__load = function() {

  var self = this;
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      try {
        request.status
      } catch(e) {
        // error 
        self.error('error :connect error :' + self.url);
      }

      if (request.status == 200) {
        // success

        var xml = request.responseXML;

        var tempBookmarks = GoogleBookmarksParser.parse(xml, self.bookmarks.length);
        self.bookmarks = self.bookmarks.concat(tempBookmarks);

        if (tempBookmarks.length < GoogleBookmarksLoader.COLLECT_SIZE) {

          var userId = 'dummy';
          localStorage.userId = userId;
          incsearch.userId = userId;

          self.total = self.bookmarks.length;

          self.update(self.bookmarks);
        } else {
          self.__load();
        }
      } else {
        // error
        var errMsg = 'error :' + request.status + ' :' + request.statusText + ' :' + self.url;
        if (request.status == 502) {
          errMsg += '<br /><br />Please login Google Account. <a href="https://www.google.com/bookmarks/" target="_blank">https://www.google.com/bookmarks/</a>';
        }
        self.error(errMsg);
      }
    }
  };

  request.open("GET", this.url + '&start=' + this.bookmarks.length + '&num=' + GoogleBookmarksLoader.COLLECT_SIZE, true);
  request.send(null);
};


GoogleBookmarksLoader.createEditUrl = function(bookmark) {
  return 'http://www.google.com/bookmarks/mark?op=edit&output=popup&bkmk=' + encodeURIComponent(bookmark.url);
};
