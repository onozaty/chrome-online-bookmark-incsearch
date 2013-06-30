var LivedoorClipParser = {
  parse: function(xml) {
    var items = xml.getElementsByTagName('item');

    var list = [];
    for (var i = 0, len = items.length; i < len; i++) {
      var bookmark = {};
      var item = items[i];

      bookmark.id = i;
      bookmark.url = this.getFirstText(item, 'link');
      bookmark.title = this.getFirstText(item, 'title');
      bookmark.info = this.getFirstText(item, 'description');
      bookmark.tags = this.getTags(item);
      bookmark.time = this.getFirstText(item, 'pubDate');

      list.push(bookmark);
    }

    return list;
  },
  getTags: function(item) {

    var tags = item.getElementsByTagNameNS('http://purl.org/dc/elements/1.1/', 'subject');

    var tagsList = [];
    for (var i = 0, len = tags.length; i < len; i++) {
      tagsList.push(tags[i].firstChild.nodeValue);
    }

    var rating = item.getElementsByTagNameNS('http://purl.org/NET/RVW/0.2/', 'rating');
    if (rating.length == 1) {
      var ratestr = '';
      for (var i = 0, len = parseInt(rating[0].firstChild.nodeValue) / 20; i < len; i++) {
        ratestr += '*';
      }
      tagsList.push(ratestr);
    }

    if (tagsList.length == 0) {
      return '';
    }
    return '[' + tagsList.join('] [') + ']';
  },
  getFirstText: function(element, tagName) {
    var firstChild = element.getElementsByTagName(tagName)[0].firstChild;
    return (firstChild) ? firstChild.nodeValue : '';
  },

  getUserId: function(xml) {
    var userUrl = xml.evaluate('/rss/channel/link', xml, null, XPathResult.STRING_TYPE, null).stringValue;
    return userUrl.substr(userUrl.lastIndexOf('/') + 1);
  }
}


var LivedoorClipLoader = function(statusElement, loadingElement, database, callback) {
  this.init(statusElement, loadingElement, database, callback);
};

for (var prop in LoaderBase.prototype) {
  LivedoorClipLoader.prototype[prop] = LoaderBase.prototype[prop];
}

LivedoorClipLoader.prototype.url = 'http://clip.livedoor.com/export/export?mode=rss';

LivedoorClipLoader.prototype._load = function() {

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

        if (xml) {
          var userId = LivedoorClipParser.getUserId(xml);

          localStorage.userId = userId;
          incsearch.userId = userId;

          var bookmarks = LivedoorClipParser.parse(xml);

          self.total = bookmarks.length;

          self.update(bookmarks);
        } else {
          // Authorization Required
          var errMsg = 'error: Please login livedoor.<br />';
          errMsg += '<a href="http://clip.livedoor.com/register/" target="_blank">http://clip.livedoor.com/register/</a>';
          self.error(errMsg);
          throw errMsg;
        }
      } else {
        // error
        var errMsg = 'error :' + request.status + ' :' + request.statusText + ' :' + self.url;
        self.error(errMsg);
      }
    }
  };

  request.open("GET", this.url, true);
  request.send(null);
};


LivedoorClipLoader.createEditUrl = function(bookmark) {

  return 'http://clip.livedoor.com/clip/edit?link=' + encodeURIComponent(bookmark.url);
};
