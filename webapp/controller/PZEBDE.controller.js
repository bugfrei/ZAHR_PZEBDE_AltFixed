sap.ui.define(
  [
    "ZAHR_PZEBDE/ZAHR_PZEBDE/controller/BaseController",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/ButtonType",
    "sap/m/Label",
    "sap/m/Input",
  ],
  function (e, t, i, s, a, n, l, r, o, u, d, b, g, h) {
    "use strict";
    return e.extend("ZAHR_PZEBDE.ZAHR_PZEBDE.controller.PZEBDE", {
      idleTimer: null,
      stView: null,
      docType: null,
      idleSeconds: null,
      workstationValue: null,
      _quantityConfirmModus: null,
      _quantityConfirmDialog: null,
      _quantityYield: null,
      _quantityScrap: null,
      _xmlViewId: null,
      _navBackIsClicked: null,
      onInit: function () {
        var e =
          this.getOwnerComponent().getManifestEntry("sap.app").dataSources[
            "ZAHR_PZEBDE_GET_FA_PSP_SRV"
          ].uri;
        this.oModel = new sap.ui.model.odata.v2.ODataModel(e);
        var t = sap.ui.core.UIComponent.getRouterFor(this);
        t.getRoute("PZEBDE").attachMatched(this.onRouteMatched, this);
        this._mViewSettingsDialogs = {};
        this.mGroupFunctions = {
          date: function (e) {
            var t = e.getProperty("date");
            return { key: t, text: t };
          },
          tmvnt: function (e) {
            var t = e.getProperty("tmvnt");
            return { key: t, text: t };
          },
        };
        this.initOvModel("pzeOvTable");
        this.initOvModel("bdeOvTable");
        this.initValues();
        var i = new sap.ui.model.json.JSONModel();
        this.getView().setModel(i);
        jQuery.sap.delayedCall(500, this, function () {
          this.resetTimer();
        });
      },
      initValues: function () {
        var e = this;
        var i = {
          success: function (t, i) {
            e.idleSeconds = i.data.results[0].idleSeconds;
            e.stView = i.data.results[0].stView;
            if (e.stView === "BDE") {
              e.getView().byId("bar0").setSelectedKey("__xmlview1--filter1");
              e.getCurrentOperationsList();
              e.getLastOperationsList();
              e.getView().byId("bdeInput0").setValue("");
            } else {
              e.getView().byId("bar0").setSelectedKey("__xmlview1--filter0");
            }
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.read("/PzeBdeInitSet", i);
      },
      onAfterRendering: function () {
        if (!this._xmlViewId) this._xmlViewId = this.getView().getIdForLabel();
        if (this._xmlViewId === "__xmlview1") {
          $(__xmlview1).bind(
            "mousemove keydown click",
            this.resetTimer.bind(this)
          );
        } else {
          $(__xmlview0).bind(
            "mousemove keydown click",
            this.resetTimer.bind(this)
          );
        }
      },
      resetTimer: function (e) {
        if (!this.idleSeconds) {
          return;
        }
        if (this._navBackIsClicked) {
          return;
        }
        clearTimeout(this.idleTimer);
        if (this._xmlViewId === "__xmlview1") {
          this.idleTimer = setTimeout(function () {
            this.history.back();
          }, this.idleSeconds * 1e3);
        }
      },
      onRouteMatched: function (e) {
        this._navBackIsClicked = false;
        jQuery.sap.delayedCall(500, this, function () {
          this.byId("bdeInput0").focus();
        });
        this.getView().byId("filter2").setVisible(false);
        this.setViewParameters(e);
        this.getHrEvents();
        this.resetTimer();
        if (this.stView && this.stView === "BDE") {
          this.getView().byId("bar0").setSelectedKey("__xmlview1--filter1");
          this.getCurrentOperationsList();
          this.getLastOperationsList();
          this.getView().byId("bdeInput0").setValue("");
          jQuery.sap.delayedCall(500, this, function () {
            this.byId("bdeInput0").focus();
          });
        } else {
          this.getView().byId("bar0").setSelectedKey("__xmlview1--filter0");
        }
        this.getView().byId("pzeButton0").setEnabled(true);
        this.getView().byId("pzeButton1").setEnabled(true);
      },
      whenUserIdle: function () {
        this.history.back();
      },
      initOvModel: function (e) {
        this.getView().byId(e).setModel(new sap.ui.model.json.JSONModel());
      },
      handleIconTabBarSelect: function (e) {
        var t = e.getParameter("key");
        switch (t) {
          case "__xmlview1--filter0":
            this.getView().byId("filter2").setVisible(false);
            break;
          case "__xmlview1--filter1":
            this.getView().byId("filter2").setVisible(false);
            this.getCurrentOperationsList();
            this.getLastOperationsList();
            this.getView().byId("bdeInput0").setValue("");
            jQuery.sap.delayedCall(500, this, function () {
              this.byId("bdeInput0").focus();
            });
            break;
          case "__xmlview1--filter2":
            break;
          case "__xmlview1--filter3":
            this.getView().byId("filter2").setVisible(false);
            this.getPzeOvDat();
            break;
          case "__xmlview1--filter4":
            this.getView().byId("filter2").setVisible(false);
            this.getBdeOvDat();
            break;
        }
      },
      getBdeOvDat: function () {
        var e = this;
        var a = [
          new i({
            path: "employeeID",
            operator: s.EQ,
            value1: this.getView().byId("pzeInput1").getValue(),
          }),
          new i({ path: "datetime", operator: s.EQ, value1: new Date() }),
        ];
        var n = {
          filters: a,
          success: function (t, i) {
            e.getView()
              .byId("bdeOvTable")
              .getModel()
              .setData({ bdeTableData: t });
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.read("/BdeOverviewSet", n);
      },
      getPzeOvDat: function () {
        var e = this;
        var a = [
          new i({
            path: "employeeID",
            operator: s.EQ,
            value1: this.getView().byId("pzeInput1").getValue(),
          }),
          new i({ path: "datetime", operator: s.EQ, value1: new Date() }),
        ];
        var n = {
          filters: a,
          success: function (t, i) {
            e.getView()
              .byId("pzeOvTable")
              .getModel()
              .setData({ pzeTableData: t });
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.read("/PzeOverviewSet", n);
      },
      onItemPress: function (e) {
        this.determineDocType(e.getParameters().listItem.getDescription());
      },
      onPressUnterbrechung: function () {
        this._quantityConfirmModus = "FAP";
        if (this.getView().byId("bdeDetailInput1").getValue()) {
          this._createQuantityConfirmDialog();
        } else {
          this._pushBreakOperation();
        }
      },
      onPressEnde: function () {
        this._quantityConfirmModus = "FAE";
        if (this.getView().byId("bdeDetailInput1").getValue()) {
          this._createQuantityConfirmDialog();
        } else {
          this._pushEndOperation();
        }
      },
      _createQuantityConfirmDialog: function () {
        var e = this;
        this._quantityConfirmDialog = new u({
          title: "Mengen Best�tigen",
          type: "Message",
          content: [
            new g({ text: "Gutmenge (Gesamt)", labelFor: "inputYield" }),
            new h("inputYield", {
              width: "100%",
              placeholder: "0",
              type: "Number",
              value: this.getView().byId("bdeDetailInput7").getValue(),
              submit: function () {
                e._quantityConfirmDialog.getContent().forEach(function (t) {
                  if (t.getId() === "inputYield") {
                    e._quantityYield = t.getValue();
                  }
                  if (t.getId() === "inputScrap") {
                    e._quantityScrap = t.getValue();
                  }
                });
                var i, s;
                i = e._quantityYield ? parseInt(e._quantityYield, 10) : "0";
                if (isNaN(i)) {
                  t.show(
                    "Neue Gutmenge konnte nicht in ein Integer umgewandelt werden."
                  );
                  return;
                }
                s = e.getView().byId("bdeDetailInput12").getValue()
                  ? parseInt(
                      e.getView().byId("bdeDetailInput12").getValue(),
                      10
                    )
                  : "0";
                if (isNaN(s)) {
                  t.show(
                    "Gesamte Gutmenge konnte nicht in ein Integer umgewandelt werden."
                  );
                  return;
                }
                if (
                  e._quantityConfirmModus !== "FAP" &&
                  e._quantityYield < 1 &&
                  e._quantityScrap < 1
                ) {
                  t.show("Ausschuss- oder Gutmenge muss mindestens 1 sein", {
                    offset: "0 -400",
                    closeOnBrowserNavigation: false,
                  });
                  return;
                }
                if (i < s) {
                  t.show(
                    "Gutmenge darf nicht kleiner sein als aktuelle Gutmenge."
                  );
                  return;
                }
                e.byId("bdeDetailInput7").setValue(e._quantityYield);
                e.byId("bdeDetailInput8").setValue(e._quantityScrap);
                if (e._quantityConfirmModus === "FAP") {
                  e._pushBreakOperation();
                } else {
                  e._pushEndOperation();
                }
                e._quantityConfirmDialog.close();
              },
            }),
            new g({ text: "Ausschussmenge", labelFor: "inputScrap" }),
            new h("inputScrap", {
              width: "100%",
              placeholder: "0",
              type: "Number",
              value: this.getView().byId("bdeDetailInput8").getValue(),
              submit: function () {
                e._quantityConfirmDialog.getContent().forEach(function (t) {
                  if (t.getId() === "inputYield") {
                    e._quantityYield = t.getValue();
                  }
                  if (t.getId() === "inputScrap") {
                    e._quantityScrap = t.getValue();
                  }
                });
                var i, s;
                i = e._quantityYield ? parseInt(e._quantityYield, 10) : "0";
                if (isNaN(i)) {
                  t.show(
                    "Neue Gutmenge konnte nicht in ein Integer umgewandelt werden."
                  );
                  return;
                }
                s = e.getView().byId("bdeDetailInput12").getValue()
                  ? parseInt(
                      e.getView().byId("bdeDetailInput12").getValue(),
                      10
                    )
                  : "0";
                if (isNaN(s)) {
                  t.show(
                    "Gesamte Gutmenge konnte nicht in ein Integer umgewandelt werden."
                  );
                  return;
                }
                if (
                  e._quantityConfirmModus !== "FAP" &&
                  e._quantityYield < 1 &&
                  e._quantityScrap < 1
                ) {
                  t.show("Ausschuss- oder Gutmenge muss mindestens 1 sein.", {
                    offset: "0 -400",
                    closeOnBrowserNavigation: false,
                  });
                  return;
                }
                if (i < s) {
                  t.show(
                    "Gutmenge darf nicht kleiner sein als aktuelle Gutmenge."
                  );
                  return;
                }
                e.byId("bdeDetailInput7").setValue(e._quantityYield);
                e.byId("bdeDetailInput8").setValue(e._quantityScrap);
                if (e._quantityConfirmModus === "FAP") {
                  e._pushBreakOperation();
                } else {
                  e._pushEndOperation();
                }
                e._quantityConfirmDialog.close();
              },
            }),
          ],
          beginButton: new o({
            type: b.Emphasized,
            text: "Best�tigen",
            press: function () {
              e._quantityConfirmDialog.getContent().forEach(function (t) {
                if (t.getId() === "inputYield") {
                  e._quantityYield = t.getValue();
                }
                if (t.getId() === "inputScrap") {
                  e._quantityScrap = t.getValue();
                }
              });
              var i, s;
              i = e._quantityYield ? parseInt(e._quantityYield, 10) : "0";
              if (isNaN(i)) {
                t.show(
                  "Neue Gutmenge konnte nicht in ein Integer umgewandelt werden."
                );
                return;
              }
              s = e.getView().byId("bdeDetailInput12").getValue()
                ? parseInt(e.getView().byId("bdeDetailInput12").getValue(), 10)
                : "0";
              if (isNaN(s)) {
                t.show(
                  "Gesamte Gutmenge konnte nicht in ein Integer umgewandelt werden."
                );
                return;
              }
              if (
                e._quantityConfirmModus !== "FAP" &&
                e._quantityYield < 1 &&
                e._quantityScrap < 1
              ) {
                t.show("Ausschuss- oder Gutmenge muss mindestens 1 sein.", {
                  offset: "0 -400",
                  closeOnBrowserNavigation: false,
                });
                return;
              }
              if (i < s) {
                t.show(
                  "Gutmenge darf nicht kleiner sein als aktuelle Gutmenge."
                );
                return;
              }
              e.byId("bdeDetailInput7").setValue(e._quantityYield);
              e.byId("bdeDetailInput8").setValue(e._quantityScrap);
              if (e._quantityConfirmModus === "FAP") {
                e._pushBreakOperation();
              } else {
                e._pushEndOperation();
              }
              e._quantityConfirmDialog.close();
            },
          }),
          endButton: new o({
            text: "Abbrechen",
            press: function () {
              e._quantityConfirmDialog.close();
            },
          }),
          afterClose: function () {
            e._quantityConfirmDialog.destroy();
          },
        });
        this._quantityConfirmDialog.open();
      },
      _pushBreakOperation: function () {
        var e = this;
        this.getView().byId("bdeDetailbutton1").setEnabled(false);
        var i = {
          employeeID: this.getView().byId("pzeInput1").getValue(),
          datetime: new Date(),
          productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
          serviceOrder: this.getView().byId("bdeDetailInput13").getValue(),
          operation: this.getView().byId("bdeDetailInput2").getValue(),
          project: this.getView().byId("bdeDetailInput0").getValue(),
          yield: this.getView().byId("bdeDetailInput7").getValue(),
          scrap: this.getView().byId("bdeDetailInput8").getValue(),
        };
        var s = {
          success: function (i, s) {
            t.show("Vorgang erfolgreich pausiert.", {
              offset: "0 -400",
              closeOnBrowserNavigation: false,
            });
            e.getView().byId("bdeDetailbutton0").setVisible(true);
            e.getView().byId("bdeDetailbutton1").setVisible(false);
            e.getView().byId("bdeDetailbutton3").setVisible(false);
            e.getView().byId("bdeDetailInput7").setEditable(false);
            e.getView().byId("bdeDetailInput8").setEditable(false);
            e.getView().byId("bdeDetailbutton1").setEnabled(true);
            e.onNavBack();
          },
          error: function (i) {
            e.getView().byId("bdeDetailbutton1").setEnabled(true);
            var s = JSON.parse(i.responseText);
            t.show(s.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.create("/OperationPauseSet", i, s);
      },
      _pushEndOperation: function () {
        this.getView().byId("bdeDetailbutton3").setEnabled(false);
        var e = this;
        var i = {
          employeeID: this.getView().byId("pzeInput1").getValue(),
          datetime: new Date(),
          productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
          serviceOrder: this.getView().byId("bdeDetailInput13").getValue(),
          operation: this.getView().byId("bdeDetailInput2").getValue(),
          project: this.getView().byId("bdeDetailInput0").getValue(),
          yield: this.getView().byId("bdeDetailInput7").getValue(),
          scrap: this.getView().byId("bdeDetailInput8").getValue(),
        };
        var s = {
          success: function (i, s) {
            t.show("Vorgang erfolgreich beendet.", {
              offset: "0 -400",
              closeOnBrowserNavigation: false,
            });
            e.getView().byId("bdeDetailbutton0").setVisible(true);
            e.getView().byId("bdeDetailbutton1").setVisible(false);
            e.getView().byId("bdeDetailbutton3").setVisible(false);
            e.getView().byId("bdeDetailInput7").setEditable(false);
            e.getView().byId("bdeDetailInput8").setEditable(false);
            e.getView().byId("bdeDetailbutton3").setEnabled(true);
            e.onNavBack();
          },
          error: function (i) {
            e.getView().byId("bdeDetailbutton3").setEnabled(true);
            var s = JSON.parse(i.responseText);
            t.show(s.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.create("/OperationEndSet", i, s);
      },
      onPressBeginn: function () {
        this.getView().byId("bdeDetailbutton0").setEnabled(false);
        var e = this;
        var i = {
          employeeID: this.getView().byId("pzeInput1").getValue(),
          datetime: new Date(),
          productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
          serviceOrder: this.getView().byId("bdeDetailInput13").getValue(),
          operation: this.getView().byId("bdeDetailInput2").getValue(),
          project: this.getView().byId("bdeDetailInput0").getValue(),
        };
        var s = {
          success: function (i, s) {
            if (s.data.multiOperation === "X") {
              t.show(
                "Vorgang erfolgreich begonnen. Mehrmaschinenbedienung Aktiv",
                { offset: "0 -400", closeOnBrowserNavigation: false }
              );
            } else {
              t.show("Vorgang erfolgreich begonnen.", {
                offset: "0 -400",
                closeOnBrowserNavigation: false,
              });
            }
            e.getView().byId("bdeDetailbutton0").setVisible(false);
            e.getView().byId("bdeDetailbutton1").setVisible(true);
            e.getView().byId("bdeDetailbutton3").setVisible(true);
            e.getView().byId("bdeDetailInput7").setEditable(true);
            e.getView().byId("bdeDetailInput8").setEditable(true);
            e.getView().byId("bdeDetailbutton0").setEnabled(true);
            e.onNavBack();
          },
          error: function (i) {
            e.getView().byId("bdeDetailbutton0").setEnabled(true);
            var s = JSON.parse(i.responseText);
            t.show(s.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.create("/OperationBeginSet", i, s);
      },
      onPressBearbeiten: function () {
        var e = this.getView().byId("bdeInput0").getValue();
        if (!e) {
          t.show("Bitte Nummer zum Bearbeiten eingeben.", {
            closeOnBrowserNavigation: false,
          });
          return;
        }
        this.determineDocType(e);
      },
      onBearbeitenSubmit: function () {
        var e = this.getView().byId("bdeInput0").getValue();
        if (!e) {
          t.show("Bitte Nummer zum Bearbeiten eingeben.", {
            closeOnBrowserNavigation: false,
          });
          jQuery.sap.delayedCall(500, this, function () {
            this.byId("bdeInput0").focus();
          });
          return;
        }
        this.determineDocType(e);
      },
      determineDocType: function (e) {
        var a = this;
        var n = [
          new i({
            path: "employeeID",
            operator: s.EQ,
            value1: this.getView().byId("pzeInput1").getValue(),
          }),
          new i({ path: "datetime", operator: s.EQ, value1: new Date() }),
          new i({ path: "input", operator: s.EQ, value1: e }),
        ];
        var l = {
          filters: n,
          success: function (e, t) {
            a.operationDetailResult(t.data.results[0]);
            a.getView().byId("filter2").setVisible(true);
            a.getView().byId("bar0").setSelectedKey("__xmlview1--filter2");
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
            jQuery.sap.delayedCall(500, a, function () {
              a.byId("bdeInput0").focus();
            });
          },
        };
        this.oModel.read("/OperationDetailsSet", l);
      },
      operationDetailResult: function (e) {
        this.getView().byId("bdeDetailInput3").setValue(e.product);
        this.getView().byId("bdeDetailInput4").setValue(e.customer);
        this.getView().byId("bdeDetailInput5").setValue(e.workstation);
        this.getView().byId("bdeDetailInput6").setValue(e.longtext);
        this.getView().byId("bdeDetailInput9").setValue(e.targetTime);
        this.getView().byId("bdeDetailInput10").setValue(e.actualTime);
        this.getView().byId("bdeDetailInput11").setValue(e.targetQuantity);
        this.getView().byId("bdeDetailInput12").setValue(e.actualQuantity);
        this.getView().byId("bdeDetailInput0").setValue("");
        this.getView().byId("bdeDetailInput1").setValue("");
        this.getView().byId("bdeDetailInput2").setValue("");
        this.getView().byId("bdeDetailInput13").setValue("");
        this.getView().byId("bdeDetailInput7").setValue("");
        this.getView().byId("bdeDetailInput8").setValue("");
        if (e.productionOrder) {
          this.getView().byId("bdeDetailInput1").setValue(e.productionOrder);
          this.getView().byId("bdeDetailInput2").setValue(e.operation);
          this.getView().byId("bdeDetailElement0").setVisible(false);
          this.getView().byId("bdeDetailInput1").setVisible(true);
          this.getView().byId("bdeDetailInput2").setVisible(true);
          this.getView().byId("bdeDetailInput13").setVisible(false);
          this.getView().byId("lblDetailFA").setVisible(true);
          this.getView().byId("lblDetailCS").setVisible(false);
          this.getView().byId("lblDetailOP").setVisible(true);
          this.getView().byId("bdeDetailElement7").setVisible(true);
          this.getView().byId("bdeDetailElement8").setVisible(true);
          this.getView().byId("lblMengeSoll").setVisible(true);
          this.getView().byId("lblMengeIst").setVisible(true);
          this.getView().byId("lblZeitSoll").setVisible(true);
          this.getView().byId("lblZeitIst").setVisible(true);
          this.getView().byId("bdeDetailInput9").setVisible(true);
          this.getView().byId("bdeDetailInput10").setVisible(true);
          this.getView().byId("bdeDetailInput11").setVisible(true);
          this.getView().byId("bdeDetailInput12").setVisible(true);
          this.getView().byId("bdeDetailInput5").setEditable(false);
          this.getView().byId("btWorkstationChange").setVisible(true);
          this.getView().byId("btWorkstationSave").setVisible(false);
          this.getView().byId("btWorkstationCancel").setVisible(false);
        } else if (e.serviceOrder) {
          this.getView().byId("bdeDetailInput13").setValue(e.serviceOrder);
          this.getView().byId("bdeDetailInput2").setValue(e.operation);
          this.getView().byId("bdeDetailElement0").setVisible(false);
          this.getView().byId("bdeDetailInput1").setVisible(false);
          this.getView().byId("bdeDetailInput2").setVisible(true);
          this.getView().byId("bdeDetailInput13").setVisible(true);
          this.getView().byId("lblDetailFA").setVisible(false);
          this.getView().byId("lblDetailCS").setVisible(true);
          this.getView().byId("lblDetailOP").setVisible(true);
          this.getView().byId("bdeDetailElement7").setVisible(false);
          this.getView().byId("bdeDetailElement8").setVisible(false);
          this.getView().byId("lblMengeSoll").setVisible(false);
          this.getView().byId("lblMengeIst").setVisible(false);
          this.getView().byId("lblZeitSoll").setVisible(true);
          this.getView().byId("lblZeitIst").setVisible(true);
          this.getView().byId("bdeDetailInput9").setVisible(true);
          this.getView().byId("bdeDetailInput10").setVisible(true);
          this.getView().byId("bdeDetailInput11").setVisible(false);
          this.getView().byId("bdeDetailInput12").setVisible(false);
          this.getView().byId("bdeDetailInput5").setEditable(false);
          this.getView().byId("btWorkstationChange").setVisible(false);
          this.getView().byId("btWorkstationSave").setVisible(false);
          this.getView().byId("btWorkstationCancel").setVisible(false);
        } else {
          this.getView().byId("bdeDetailInput0").setValue(e.project);
          this.getView().byId("bdeDetailElement0").setVisible(true);
          this.getView().byId("bdeDetailInput1").setVisible(false);
          this.getView().byId("bdeDetailInput2").setVisible(false);
          this.getView().byId("bdeDetailInput13").setVisible(false);
          this.getView().byId("lblDetailFA").setVisible(false);
          this.getView().byId("lblDetailCS").setVisible(false);
          this.getView().byId("lblDetailOP").setVisible(false);
          this.getView().byId("bdeDetailElement7").setVisible(false);
          this.getView().byId("bdeDetailElement8").setVisible(false);
          this.getView().byId("lblMengeSoll").setVisible(false);
          this.getView().byId("lblMengeIst").setVisible(false);
          this.getView().byId("lblZeitSoll").setVisible(true);
          this.getView().byId("lblZeitIst").setVisible(true);
          this.getView().byId("bdeDetailInput9").setVisible(true);
          this.getView().byId("bdeDetailInput10").setVisible(true);
          this.getView().byId("bdeDetailInput11").setVisible(false);
          this.getView().byId("bdeDetailInput12").setVisible(false);
          this.getView().byId("bdeDetailInput5").setEditable(false);
          this.getView().byId("btWorkstationChange").setVisible(false);
          this.getView().byId("btWorkstationSave").setVisible(false);
          this.getView().byId("btWorkstationCancel").setVisible(false);
        }
        if (e.tmvnt === "PSB" || e.tmvnt === "CSB" || e.tmvnt === "FAB") {
          this.getView().byId("bdeDetailbutton0").setVisible(false);
          this.getView().byId("bdeDetailbutton1").setVisible(true);
          this.getView().byId("bdeDetailbutton3").setVisible(true);
          this.getView().byId("bdeDetailInput7").setEditable(true);
          this.getView().byId("bdeDetailInput8").setEditable(true);
          if (e.tmvnt === "FAB") {
            this.getView().byId("btWorkstationChange").setVisible(false);
          }
        } else {
          this.getView().byId("bdeDetailbutton0").setVisible(true);
          this.getView().byId("bdeDetailbutton1").setVisible(false);
          this.getView().byId("bdeDetailbutton3").setVisible(false);
          this.getView().byId("bdeDetailInput7").setEditable(false);
          this.getView().byId("bdeDetailInput8").setEditable(false);
        }
      },
      onPressWorkstationChange: function () {
        this.workstationValue = this.getView()
          .byId("bdeDetailInput5")
          .getValue();
        this.getView().byId("btWorkstationChange").setVisible(false);
        this.getView().byId("btWorkstationSave").setVisible(true);
        this.getView().byId("btWorkstationCancel").setVisible(true);
        this.getView().byId("bdeDetailInput5").setEditable(true);
        this.getView()
          .byId("bdeDetailInput5")
          .setValue(this.workstationValue.charAt(0));
      },
      onPressWorkstationSave: function () {
        this.onWorkstationSubmit();
      },
      onPressWorkstationCancel: function () {
        this.getView().byId("bdeDetailInput5").setValue(this.workstationValue);
        this.getView().byId("btWorkstationChange").setVisible(true);
        this.getView().byId("btWorkstationSave").setVisible(false);
        this.getView().byId("btWorkstationCancel").setVisible(false);
        this.getView().byId("bdeDetailInput5").setEditable(false);
      },
      onWorkstationSubmit: function (e) {
        var i = this;
        if (
          this.workstationValue ===
          this.getView().byId("bdeDetailInput5").getValue()
        ) {
          return;
        }
        var s = {
          productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
          operation: this.getView().byId("bdeDetailInput2").getValue(),
          workstation: this.getView().byId("bdeDetailInput5").getValue(),
        };
        var a = {
          success: function (e, s) {
            t.show("Arbeitsplatz wurde erfolgreich ge�ndert", {
              closeOnBrowserNavigation: false,
            });
            i.getView().byId("btWorkstationChange").setVisible(true);
            i.getView().byId("btWorkstationSave").setVisible(false);
            i.getView().byId("btWorkstationCancel").setVisible(false);
            i.getView().byId("bdeDetailInput5").setEditable(false);
          },
          error: function (e) {
            i.getView()
              .byId("bdeDetailInput5")
              .setValue(this.workstationValue.charAt(0));
            var s = JSON.parse(e.responseText);
            t.show(s.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.create("/WorkstationChangeSet", s, a);
      },
      getLastOperationsList: function () {
        var e = this;
        var a = [
          new i({
            path: "employeeID",
            operator: s.EQ,
            value1: this.getView().byId("pzeInput1").getValue(),
          }),
          new i({ path: "datetime", operator: s.EQ, value1: new Date() }),
        ];
        var n = {
          filters: a,
          success: function (t, i) {
            e.addLastOperationItems(i.data.results);
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.read("/OperationSet", n);
      },
      getCurrentOperationsList: function () {
        var e = this;
        var a = [
          new i({
            path: "employeeID",
            operator: s.EQ,
            value1: this.getView().byId("pzeInput1").getValue(),
          }),
          new i({ path: "datetime", operator: s.EQ, value1: new Date() }),
        ];
        var n = {
          filters: a,
          success: function (t, i) {
            e.addCurrentOperationsItems(i.data.results);
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.read("/OperationsCurrentSet", n);
      },
      addCurrentOperationsItems: function (e) {
        var t = this;
        var i = t.getView().byId("bdeList1");
        i.removeAllItems();
        e.forEach(function (e) {
          var t;
          var s = new sap.m.StandardListItem();
          if (e.productionOrder) {
            t = e.productionOrder + "-" + e.operation;
            s.setTitle("Fertigungsauftrag: ");
            s.setDescription(t);
          } else if (e.serviceOrder) {
            t = e.serviceOrder + "-" + e.operation;
            s.setTitle("Serviceauftrag: ");
            s.setDescription(t);
          } else {
            s.setTitle("Projekt: ");
            s.setDescription(e.project);
          }
          s.setType("Navigation");
          i.addItem(s);
        });
      },
      addLastOperationItems: function (e) {
        var t = this;
        var i = t.getView().byId("bdeList0");
        i.removeAllItems();
        e.forEach(function (e) {
          var t = new sap.m.StandardListItem();
          if (e.productionOrder) {
            var s = e.productionOrder + "-" + e.operation;
            t.setTitle("Fertigungsauftrag: ");
            t.setDescription(s);
          } else if (e.serviceOrder) {
            s = e.serviceOrder + "-" + e.operation;
            t.setTitle("Serviceauftrag: ");
            t.setDescription(s);
          } else {
            t.setTitle("Projekt: ");
            t.setDescription(e.project);
          }
          t.setType("Navigation");
          i.addItem(t);
        });
      },
      onNavBack: function () {
        this.getView().invalidate();
        this._navBackIsClicked = true;
        clearTimeout(this.idleTimer);
        var e = sap.ui.core.UIComponent.getRouterFor(this);
        e.navTo("Login", {}, true);
      },
      onKommen: function () {
        this.getView().byId("pzeButton0").setEnabled(false);
        this.createODataRequest("/onKommenSet", false);
      },
      onGehen: function () {
        this.getView().byId("pzeButton1").setEnabled(false);
        this.createODataRequest("/onGehenSet", false);
      },
      createODataRequest: function (e, i) {
        var s = this;
        var a = {
          success: function (i, a) {
            s.addTimelineItem(a.data, e);
            s.onNavBack();
            var n = "Kommen erfolgreich gebucht.";
            var l = "Gehen erfolgreich gebucht.";
            if (a.data.autoBreak > 0) {
              l =
                l +
                "Es wurden " +
                a.data.autoBreak +
                " Vorg�nge automatisch beendet.";
            }
            t.show(e === "/onKommenSet" ? n : l, {
              offset: "0 -400",
              closeOnBrowserNavigation: false,
            });
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            if (i.error.message.value === "pushConfirmationPopup") {
              s._createPzeStartConfirmDialog();
            } else {
              t.show(i.error.message.value, {
                closeOnBrowserNavigation: false,
              });
            }
            s.getView().byId("pzeButton0").setEnabled(true);
            s.getView().byId("pzeButton1").setEnabled(true);
          },
        };
        var n = {
          employeeID: this.getView().byId("pzeInput1").getValue(),
          datetime: new Date(),
        };
        if (e === "/onKommenSet") {
          n.beginConfirm = i;
        }
        this.oModel.create(e, n, a);
      },
      _createPzeStartConfirmDialog: function () {
        if (!this._pzeStartConfirmDialog) {
          this._pzeStartConfirmDialog = new u({
            type: "Message",
            title: "Kommen erneut buchen?",
            content: new d({
              text: "Ihre vorige Buchung war ebenfalls KOMMT. M�chten Sie wirklich KOMMT buchen?",
            }),
            beginButton: new o({
              type: b.Emphasized,
              text: "Ja",
              press: function () {
                this.createODataRequest("/onKommenSet", true);
                this._pzeStartConfirmDialog.close();
              }.bind(this),
            }),
            endButton: new o({
              text: "Abbruch",
              press: function () {
                this._pzeStartConfirmDialog.close();
              }.bind(this),
            }),
          });
        }
        this._pzeStartConfirmDialog.open();
      },
      setViewParameters: function (e) {
        this.getView()
          .byId("pzeInput0")
          .setValue(e.getParameter("arguments").timeID);
        this.getView()
          .byId("pzeInput1")
          .setValue(e.getParameter("arguments").employeeID);
        this.getView()
          .byId("pzeInput2")
          .setValue(e.getParameter("arguments").name);
      },
      getHrEvents: function () {
        var e = this;
        var a = [
          new i({
            path: "employeeID",
            operator: s.EQ,
            value1: this.getView().byId("pzeInput1").getValue(),
          }),
          new i({ path: "datetime", operator: s.EQ, value1: new Date() }),
        ];
        var n = {
          filters: a,
          success: function (t, i) {
            e.addTimelineItems(i.data.results);
          },
          error: function (e) {
            var i = JSON.parse(e.responseText);
            t.show(i.error.message.value, { closeOnBrowserNavigation: false });
          },
        };
        this.oModel.read("/KommenInitSet", n);
      },
      addTimelineItems: function (e) {
        var t = this;
        var i = t.getView().byId("pzeTimeline");
        i.removeAllContent();
        e.forEach(function (e) {
          var t = new sap.suite.ui.commons.TimelineItem();
          if (e.tmvnt === "HRK") {
            t.setTitle("Kommen");
          } else {
            t.setTitle("Gehen");
          }
          t.setDateTime(e.datetime);
          i.addContent(t);
        });
      },
      addTimelineItem: function (e, t) {
        var i = this;
        var s = i.getView().byId("pzeTimeline");
        var a = new sap.suite.ui.commons.TimelineItem();
        if (t === "/onKommenSet") {
          a.setTitle("Kommen");
        } else {
          a.setTitle("Gehen");
        }
        a.setDateTime(e.datetime);
        s.addContent(a);
      },
      onExit: function () {
        var e, t;
        for (e in this._mViewSettingsDialogs) {
          t = this._mViewSettingsDialogs[e];
          if (t) {
            t.destroy();
          }
        }
      },
      createViewSettingsDialog: function (e) {
        var t = this._mViewSettingsDialogs[e];
        if (!t) {
          t = sap.ui.xmlfragment(e, this);
          this._mViewSettingsDialogs[e] = t;
          if (a.system.desktop) {
            t.addStyleClass("sapUiSizeCompact");
          }
        }
        return t;
      },
      handleSortButtonPressed: function () {
        this.createViewSettingsDialog(
          "ZAHR_PZEBDE.ZAHR_PZEBDE.view.SortDialog"
        ).open();
      },
      handleFilterButtonPressed: function () {
        this.createViewSettingsDialog(
          "ZAHR_PZEBDE.ZAHR_PZEBDE.view.FilterDialog"
        ).open();
      },
      handleGroupButtonPressed: function () {
        this.createViewSettingsDialog(
          "ZAHR_PZEBDE.ZAHR_PZEBDE.view.GroupDialog"
        ).open();
      },
      handleSortDialogConfirm: function (e) {
        var t = this.byId("pzeOvTable"),
          i = e.getParameters(),
          s = t.getBinding("items"),
          a,
          n,
          l = [];
        a = i.sortItem.getKey();
        n = i.sortDescending;
        var r = new sap.ui.model.Sorter(a, n);
        l.push(r);
        s.sort(l);
      },
      handleFilterDialogConfirm: function (e) {
        var t = this.byId("pzeOvTable"),
          s = e.getParameters(),
          a = t.getBinding("items"),
          n = [];
        s.filterItems.forEach(function (e) {
          var t = e.getKey().split("___"),
            s = t[0],
            a = t[1],
            l = t[2],
            r = t[3],
            o = new i(s, a, l, r);
          n.push(o);
        });
        a.filter(n);
        this.byId("vsdFilterBar").setVisible(n.length > 0);
        this.byId("vsdFilterLabel").setText(s.filterString);
      },
      handleGroupDialogConfirm: function (e) {
        var t = this.byId("pzeOvTable"),
          i = e.getParameters(),
          s = t.getBinding("items"),
          a,
          n,
          l,
          r = [];
        if (i.groupItem) {
          a = i.groupItem.getKey();
          n = i.groupDescending;
          l = this.mGroupFunctions[a];
          r.push(new sap.ui.model.Sorter(a, n, l));
          s.sort(r);
        }
      },
      handleSortButtonPressedBde: function () {
        this.createViewSettingsDialog(
          "ZAHR_PZEBDE.ZAHR_PZEBDE.view.SortDialogBde"
        ).open();
      },
      handleFilterButtonPressedBde: function () {
        this.createViewSettingsDialog(
          "ZAHR_PZEBDE.ZAHR_PZEBDE.view.FilterDialogBde"
        ).open();
      },
      handleGroupButtonPressedBde: function () {
        this.createViewSettingsDialog(
          "ZAHR_PZEBDE.ZAHR_PZEBDE.view.GroupDialogBde"
        ).open();
      },
      handleSortDialogConfirmBde: function (e) {
        var t = this.byId("bdeOvTable"),
          i = e.getParameters(),
          s = t.getBinding("items"),
          a,
          n,
          l = [];
        a = i.sortItem.getKey();
        n = i.sortDescending;
        var r = new sap.ui.model.Sorter(a, n);
        l.push(r);
        s.sort(l);
      },
      handleFilterDialogConfirmBde: function (e) {
        var t = this.byId("bdeOvTable"),
          s = e.getParameters(),
          a = t.getBinding("items"),
          n = [];
        s.filterItems.forEach(function (e) {
          var t = e.getKey().split("___"),
            s = t[0],
            a = t[1],
            l = t[2],
            r = t[3],
            o = new i(s, a, l, r);
          n.push(o);
        });
        a.filter(n);
        this.byId("vsdFilterBar").setVisible(n.length > 0);
        this.byId("vsdFilterLabel").setText(s.filterString);
      },
      handleGroupDialogConfirmBde: function (e) {
        var t = this.byId("bdeOvTable"),
          i = e.getParameters(),
          s = t.getBinding("items"),
          a,
          n,
          l,
          r = [];
        if (i.groupItem) {
          a = i.groupItem.getKey();
          n = i.groupDescending;
          l = this.mGroupFunctions[a];
          r.push(new sap.ui.model.Sorter(a, n, l));
          s.sort(r);
        }
      },
    });
  }
);
