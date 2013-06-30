var LoaderBase = function(){};
LoaderBase.prototype = {
  init: function(loadingBox, loadingMessage, database, callback) {
    this.loadingBox  = loadingBox;
    this.loadingMessage = loadingMessage;
    this.database = database;
    this.callback = callback || function() {};

    this.load();
  },
  insertSql: "INSERT INTO bookmark VALUES(?, ?, ?, ?, ?, ?, ?)",
  truncateSql: 'DELETE FROM bookmark',

  load: function() {
    this.dispStart();

    this.bookmarks = [];
    this.total     = null;

    this._load();
  },
  dispStart: function() {
    Glayer.showBox(this.loadingBox);
    this.loadingMessage.innerHTML = 'Bookmarks Loading...';
  },
  dispEnd: function() {
    this.loadingBox.style.display = 'none';
    Glayer.showAlert('Finish!!  loaded ' + this.total + ' bookmarks', {callback: function(){ incsearch.input.focus(); Glayer.hideAlert(); }});
    document.getElementById(Glayer.defaultAlert.okId).focus();

    incsearch.reset();
  },
  error: function(errMsg) {
    this.loadingBox.style.display = 'none';

    var self = this;
    Glayer.showConfirm(
      errMsg, 
      function(result){
        Glayer.hideConfirm();
        if (result) {
          self.dispStart();
          self._load();
        } else {
          incsearch.input.focus();
        }
      },
      {okLabel: 'Retry', cancelLabel: 'cancel'}
    );
    document.getElementById(Glayer.defaultConfirm.cancelId).focus();

    throw errMsg;
  },

  update: function(bookmarks) {

    var transaction = this.database.transaction({
      sql: this.truncateSql
    });

    for (var i = 0, len = bookmarks.length; i < len; i++) {
      transaction.next({
        sql: this.insertSql,
        params: this.createInsertArguments(bookmarks[i])
      });
    }

    var self = this;
    transaction.success(function() {
      self.dispEnd();
    }).
    start();
  },

  createInsertArguments: function(bookmark) {
    return [bookmark.id, bookmark.url, bookmark.title, bookmark.info, bookmark.tags, bookmark.time, this.createSearchText(bookmark)];
  },

  createSearchText: function(bookmark) {
    return [bookmark.title, bookmark.info, bookmark.tags].join("\n");
  }
}
