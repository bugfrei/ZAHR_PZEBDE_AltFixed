sap.ui.define(
  [
    "ZAHR_PZEBDE/ZAHR_PZEBDE/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
  ],
  function (e, t, i, n) {
    "use strict";
    return e.extend("ZAHR_PZEBDE.ZAHR_PZEBDE.controller.Login", {
      clockRefresh: 1e3,
      clockTimer: null,
      inputRefresh: 5e3,
      inputTimer: null,
      _intervalId: null,
      _userLanguage: null,
      onInit: function () {
        var e = this;
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute("Login").attachMatched(this.onRouteMatched, this);
        var t =
          this.getOwnerComponent().getManifestEntry("sap.app").dataSources[
            "ZAHR_PZEBDE_GET_FA_PSP_SRV"
          ].uri;
        this.oModel = new sap.ui.model.odata.v2.ODataModel(t);
        jQuery.sap.delayedCall(500, this, function () {
          this.byId("inputTimeID").focus();
        });
        this.clearAusweisnummerInput();
        this.setDatetime();
        this.getView()
          .byId("inputTimeID")
          .addEventDelegate({
            onfocusout: function () {
              e.byId("inputTimeID").focus();
            },
          });
        this._getUserLanguage();
      },
      _redirectToCorrectLanguage: function () {
        var e = this._userLanguage;
        var t = window.location.href;
        var i = "sap-language=" + e;
        if (t.search(i) >= 0) return;
        var n = this._replaceUrlParam(t, "sap-language", e);
        window.location.replace(n);
      },
      _replaceUrlParam: function (e, t, i) {
        var n = t + "=" + i;
        var a = new RegExp("sap-language=.");
        if (e.search(a) >= 0) {
          return e.replace(a, n);
        }
        var s = e.split("#");
        var r = e.includes("?") ? "&" : "?";
        return s[0] + r + n + "#" + s[1];
      },
      _getUserLanguage: function () {
        var e = this;
        var n = [];
        var a = new t({
          path: "userID",
          operator: i.EQ,
          value1: sap.ushell.Container.getService("UserInfo").getId(),
        });
        n.push(a);
        var s = {
          filters: n,
          success: function (t, i) {
            e._userLanguage = i.data.results[0].language;
            e._redirectToCorrectLanguage();
          },
          error: function (t) {
            e._userLanguage = "";
          },
        };
        this.oModel.read("/UserLanguageSet", s);
      },
      setDatetime: function () {
        var e = this;
        var t = new Date(),
          i =
            t.getMonth() + 1 < 10 ? "0" + (t.getMonth() + 1) : t.getMonth() + 1,
          n = t.getYear() + 1900,
          a = t.getDate() < 10 ? "0" + t.getDate() : t.getDate(),
          s = a + "." + i + "." + n,
          r = t.getSeconds() < 10 ? "0" + t.getSeconds() : t.getSeconds(),
          u = t.getHours() < 10 ? "0" + t.getHours() : t.getHours(),
          o = t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes();
        s = u + ":" + o + ":" + r + " " + s;
        this.getView().byId("labelDateTime").setText(s);
        this.clockTimer = setTimeout(function () {
          e.setDatetime();
        }, this.clockRefresh);
      },
      clearAusweisnummerInput: function () {
        var e = this;
        if (this.getView().byId("inputTimeID").getValue(""))
          this.getView().byId("inputTimeID").setValue("");
        this.inputTimer = setTimeout(function () {
          e.clearAusweisnummerInput();
        }, this.inputRefresh);
      },
      onRouteMatched: function (e) {
        var t = this;
        this.getView().byId("inputTimeID").setValue("");
        jQuery.sap.delayedCall(500, this, function () {
          this.byId("inputTimeID").focus();
        });
      },
      onInputLiveChange: function (e) {
        var t = this;
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(function () {
          t.clearAusweisnummerInput();
        }, this.inputRefresh);
        if (this.getView().byId("inputTimeID").getValue().length === 14) {
          this.onLogin(e);
        }
      },
      onInputSubmit: function (e) {
        this.onLogin(e);
      },
      onLogin: function (e) {
        this.getView().byId("buttonLogin").setEnabled(false);
        var a = this;
        if (!this.getView().byId("inputTimeID").getValue()) {
          n.show("Ausweisnummer darf nicht leer sein.", {
            offset: "0 -300",
            closeOnBrowserNavigation: false,
          });
          this.getView().byId("buttonLogin").setEnabled(true);
          this.getView().byId("inputTimeID").setValue("");
          return;
        }
        var s = this.getView().byId("inputTimeID").getValue();
        var r = [];
        var u = new t({ path: "timeID", operator: i.EQ, value1: s });
        r.push(u);
        var o = {
          filters: r,
          success: function (e, t) {
            a.oRouter.navTo(
              "PZEBDE",
              {
                timeID: t.data.results[0].timeID,
                employeeID: t.data.results[0].employeeID,
                name: t.data.results[0].name,
              },
              true
            );
            a.getView().byId("buttonLogin").setEnabled(true);
          },
          error: function (e) {
            a.getView().byId("buttonLogin").setEnabled(true);
            var t = JSON.parse(e.responseText);
            n.show(t.error.message.value, {
              offset: "0 -300",
              closeOnBrowserNavigation: false,
            });
            a.getView().byId("inputTimeID").setValue("");
          },
        };
        this.oModel.read("/LoginSet", o);
      },
      onAfterRendering: function () {
        jQuery.sap.delayedCall(500, this, function () {
          this.byId("inputTimeID").focus();
        });
      },
    });
  }
);
