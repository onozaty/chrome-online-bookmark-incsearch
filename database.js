// Database
function Database(name, displayName, version, estimatedSize, transactionErrorCallback) {
  this.database = window.openDatabase(name, displayName, version, estimatedSize);
  this.transactionErrorCallback = transactionErrorCallback;
}
Database.prototype = {
  transaction: function(executeSql) {
    return new Database.Transaction(
                            this.database,
                            executeSql,
                            this.transactionErrorCallback);
  },
}

Database.Transaction = function(database, executeSql, errorCallback, successCallback) {
  this.database = database;
  this.executeSqls = [];
  this.errorCallback = errorCallback;
  this.successCallback = successCallback;

  if (executeSql) {
    this.next(executeSql);
  }
}
Database.Transaction.prototype = {
  next: function(executeSql) {
    if (typeof executeSql == "string") {
      executeSql = {sql: executeSql};
    }

    this.executeSqls.push(executeSql);
    return this;
  },
  start: function() {
    var self = this;
    this.database.transaction(function(tx) {
      self._exec(tx);
    }, this.errorCallback, this.successCallback);
  },
  _exec: function(tx) {
    var self = this;
    var executeSql = self.executeSqls.shift();
    if (executeSql) {
      tx.executeSql(executeSql.sql, executeSql.params, function(tx, result) {
        if (executeSql.callback) {
          executeSql.callback(tx, result);
        }
        self._exec(tx);
      });
    }
    return this;
  },
  success: function(successCallback) {
    this.successCallback = successCallback;
    return this;
  },
  error: function(errorCallback) {
    this.errorCallback = errorCallback;
    return this;
  },
}
