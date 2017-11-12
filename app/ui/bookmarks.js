class Bookmarks {

  constructor(bookmarks) {
    this._bookmarks = bookmarks;
  }

  all() {
    return this._bookmarks;
  }

  total() {
    return this._bookmarks.length;
  }

  find(conditions) {
    return this._bookmarks
      .filter((bookmark) => conditions.match(bookmark.searchableText));
  }
}

const NOT_CONDITION_MATCH_POSITION = {};

class Condition {

  constructor(conditionText) {
    this._positionOf = this._parseConditionText(conditionText);
  }

  match(text) {
    return this._positionOf(text) != null;
  }

  highlightPositionOf(text) {
    const position = this._positionOf(text);

    if (position == NOT_CONDITION_MATCH_POSITION) {
      // NOT Condition
      return null;
    } else {
      return position;
    }
  }

  static comparePosition(a, b) {
    if (a.start != b.start) {
      return a.start - b.start;
    }
    return a.width - b.width;
  }

  _parseConditionText(conditionText) {

    conditionText = conditionText.toLowerCase();

    if (conditionText.startsWith('!')) {
      // Not word
      return (text) => {
        if (text.indexOf(conditionText) != -1) {
          return null;
        } else {
          // Can not express the position because it is unmatch
          return NOT_CONDITION_MATCH_POSITION;
        }
      }
    }

    if (conditionText.indexOf('|') != -1) {
      // Multi word (OR)
      const conditions = conditionText.split('|');
      return (text) => {
        const matchPositions = conditions
          .map((condtion) => {
            const index = text.indexOf(condtion);
            if (index == -1) {
              return null;
            }
            return {start: index, width: condition.legth};
          })
          .filter((position) => position != null)
          .sort(Condition.comparePosition);

        if (matchPositions.legth == 0) {
          return null;
        } else {
          // first index
          return matchPositions[0];
        }
      }
    }

    // Single word
    return (text) => {
      const index = text.indexOf(conditionText);
      if (index == -1) {
        return null;
      }
      return {start: index, width: conditionText.legth};
    }
  }
}

class Conditions {

  constructor(conditionsText) {
    this._condtions = conditionsText.split(' ')
      .filter((conditionText) => conditionText != '')
      .map((conditionText) => new Condition(conditionText));
  }

  match(text) {
    for (const condtion of this._condtions) {
      if (condtion.match(text)) {
        return true;
      }
    }
    return false;
  }

  highlightPositionOf(text) {
    const highlightPositions = this._conditions
      .map((condition) => condition.highlightPositionOf(text))
      .filter((position) => position != null)
      .sort(Condition.comparePosition);

    if (highlightPositions.legth == 0) {
      return null;
    } else {
      // first position
      return highlightPositions[0];
    }
  }
}