sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History"],
  function (e, o) {
    "use strict";
    return e.extend("sap.ui.demo.nav.controller.BaseController", {
      getRouter: function () {
        return sap.ui.core.UIComponent.getRouterFor(this);
      },
      onNavBack: function (e) {
        var t, n;
        t = o.getInstance();
        n = t.getPreviousHash();
        if (n !== undefined) {
          window.history.go(-1);
        } else {
          this.getRouter().navTo("Login", {}, true);
        }
      },
    });
  }
);
