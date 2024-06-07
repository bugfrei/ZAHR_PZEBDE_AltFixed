sap.ui.define(function () {
  "use strict";
  var e = {
    weightState: function (e) {
      try {
        e = parseFloat(e);
        if (e < 0) {
          return "None";
        } else if (e < 1e3) {
          return "Success";
        } else if (e < 2e3) {
          return "Warning";
        } else {
          return "Error";
        }
      } catch (e) {
        return "None";
      }
    },
  };
  return e;
}, true);
