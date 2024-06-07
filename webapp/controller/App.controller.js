sap.ui.define(
  ["ZAHR_PZEBDE/ZAHR_PZEBDE/controller/BaseController"],
  function (e) {
    "use strict";
    return e.extend("ZAHR_PZEBDE.ZAHR_PZEBDE.controller.App", {
      _intervalId: null,
      onInit: function () {
        this._intervalId = setInterval(function () {
          jQuery
            .ajax({
              type: "HEAD",
              cache: false,
              url: "/sap/bc/ui5_ui5/sap/zahr_pzebde/Component.js",
            })
            .done(function (e) {
              jQuery.sap.log.debug(
                "pingServer",
                "Successfully pinged the server to extend the session"
              );
            })
            .fail(function () {
              jQuery.sap.log.error(
                "pingServer",
                "failed to ping the server to extend the session"
              );
            });
        }, 9e5);
      },
      onExit: function () {
        clearInterval(this._intervalId);
      },
    });
  }
);
