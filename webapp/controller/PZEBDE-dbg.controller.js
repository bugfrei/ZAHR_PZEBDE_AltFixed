sap.ui.define([
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
	"sap/m/Input"
], function (BaseController, MessageToast, Filter, FilterOperator, Device, Sorter, JSONModel, Fragment, Button, Dialog, Text, ButtonType,
	Label, Input) {
	"use strict";

	return BaseController.extend("ZAHR_PZEBDE.ZAHR_PZEBDE.controller.PZEBDE", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.PZEBDE
		 */

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
			//Get Service Url for OData
			var sServiceUrl = this.getOwnerComponent().getManifestEntry("sap.app").dataSources["ZAHR_PZEBDE_GET_FA_PSP_SRV"].uri;
			this.oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);

			//Get Data from Login View
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("PZEBDE").attachMatched(this.onRouteMatched, this);

			/*Table Init*/
			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
			this._mViewSettingsDialogs = {};

			this.mGroupFunctions = {
				date: function (oContext) {
					var name = oContext.getProperty("date");
					return {
						key: name,
						text: name
					};
				},
				tmvnt: function (oContext) {
					var name = oContext.getProperty("tmvnt");
					return {
						key: name,
						text: name
					};
				}
			};

			this.initOvModel("pzeOvTable");
			this.initOvModel("bdeOvTable");
			this.initValues();

			var tableJSONModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(tableJSONModel);

			jQuery.sap.delayedCall(500, this, function () {
				this.resetTimer();
			});
		},

		initValues: function () {
			var that = this;

			//Prepare oParameters
			var oParameters = {
				success: function (oData, response) {
					that.idleSeconds = response.data.results[0].idleSeconds;
					that.stView = response.data.results[0].stView;
					if (that.stView === "BDE") {
						that.getView().byId("bar0").setSelectedKey("__xmlview1--filter1");
						that.getCurrentOperationsList();
						that.getLastOperationsList();
						that.getView().byId("bdeInput0").setValue("");
					}
					else {
						that.getView().byId("bar0").setSelectedKey("__xmlview1--filter0");
					}
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.read("/PzeBdeInitSet", oParameters);
		},

		onAfterRendering: function () {
			if (!this._xmlViewId) this._xmlViewId = this.getView().getIdForLabel();
			if (this._xmlViewId === "__xmlview1") {
				$(__xmlview1).bind("mousemove keydown click", this.resetTimer.bind(this));
			}
			else {
				$(__xmlview0).bind("mousemove keydown click", this.resetTimer.bind(this));
			}
		},

		resetTimer: function (oEvent) {
			if (!this.idleSeconds) {
				return;
			}
			if (this._navBackIsClicked) {
				return;
			}
			// if (!this._xmlViewId) this._xmlViewId = this.getView().getIdForLabel();
			clearTimeout(this.idleTimer);
			if (this._xmlViewId === "__xmlview1") {
				// if (!$(__xmlview1).attr("class").toString().includes("sapMNavItemHidden")) {
				this.idleTimer = setTimeout(function () {
					this.history.back();
				}, this.idleSeconds * 1000);
				// }
			}
			// }
			// else {
			// 	if (!$(__xmlview0).attr("class").toString().includes("sapMNavItemHidden")) {
			// 		this.idleTimer = setTimeout(function () {
			// 			this.history.back();
			// 		}, this.idleSeconds * 1000);
			// 	}
			// }
		},

		onRouteMatched: function (oEvent) {
			this._navBackIsClicked = false;
			// this.getView().byId("bdeInput0").focus();
			jQuery.sap.delayedCall(500, this, function () {
				this.byId("bdeInput0").focus();
			});
			this.getView().byId("filter2").setVisible(false);
			this.setViewParameters(oEvent);
			this.getHrEvents();
			this.resetTimer();
			if (this.stView && this.stView === "BDE") {
				this.getView().byId("bar0").setSelectedKey("__xmlview1--filter1");
				this.getCurrentOperationsList();
				this.getLastOperationsList();
				this.getView().byId("bdeInput0").setValue("");
				// this.getView().byId("bdeInput0").focus();
				jQuery.sap.delayedCall(500, this, function () {
					this.byId("bdeInput0").focus();
				});
			}
			else {
				this.getView().byId("bar0").setSelectedKey("__xmlview1--filter0");
			}
			this.getView().byId("pzeButton0").setEnabled(true);
			this.getView().byId("pzeButton1").setEnabled(true);
		},

		whenUserIdle: function () {
			this.history.back();
		},

		initOvModel: function (tableId) {
			// var tableJSONModel = new sap.ui.model.json.JSONModel();
			this.getView().byId(tableId).setModel(new sap.ui.model.json.JSONModel());
		},

		handleIconTabBarSelect: function (oEvent) {
			var selectedTab = oEvent.getParameter("key");
			switch (selectedTab) {
			case "__xmlview1--filter0":
				//PZE
				this.getView().byId("filter2").setVisible(false);
				break;
			case "__xmlview1--filter1":
				//BDE
				this.getView().byId("filter2").setVisible(false);
				this.getCurrentOperationsList();
				this.getLastOperationsList();
				this.getView().byId("bdeInput0").setValue("");
				// this.getView().byId("bdeInput0").focus();
				jQuery.sap.delayedCall(500, this, function () {
					this.byId("bdeInput0").focus();
				});
				break;
			case "__xmlview1--filter2":
				//BDE Detail
				break;
			case "__xmlview1--filter3":
				//PZE Overview
				this.getView().byId("filter2").setVisible(false);
				this.getPzeOvDat();
				break;
			case "__xmlview1--filter4":
				//BDE Overview
				this.getView().byId("filter2").setVisible(false);
				this.getBdeOvDat();
				break;
			}
		},

		getBdeOvDat: function () {
			var that = this;
			//Prepare aFilters
			var aFilters = [
				new Filter({
					path: "employeeID",
					operator: FilterOperator.EQ,
					value1: this.getView().byId("pzeInput1").getValue()
				}),
				new Filter({
					path: "datetime",
					operator: FilterOperator.EQ,
					value1: new Date()
				})
			];

			//Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					that.getView().byId("bdeOvTable").getModel().setData({
						bdeTableData: oData
					});
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.read("/BdeOverviewSet", oParameters);
		},

		getPzeOvDat: function () {
			var that = this;
			//Prepare aFilters
			var aFilters = [
				new Filter({
					path: "employeeID",
					operator: FilterOperator.EQ,
					value1: this.getView().byId("pzeInput1").getValue()
				}),
				new Filter({
					path: "datetime",
					operator: FilterOperator.EQ,
					value1: new Date()
				})
			];

			//Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					that.getView().byId("pzeOvTable").getModel().setData({
						pzeTableData: oData
					});
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.read("/PzeOverviewSet", oParameters);
		},

		onItemPress: function (oEvent) {
			this.determineDocType(oEvent.getParameters().listItem.getDescription());
		},

		onPressUnterbrechung: function () {
			this._quantityConfirmModus = "FAP";
			if (this.getView().byId("bdeDetailInput1").getValue()) {
				//Fertigungsauftr�ge
				this._createQuantityConfirmDialog();
			}
			else {
				//CS-Auftr�ge und Projekte
				this._pushBreakOperation();
			}
		},

		onPressEnde: function () {
			this._quantityConfirmModus = "FAE";
			if (this.getView().byId("bdeDetailInput1").getValue()) {
				//Fertigungsauftr�ge
				this._createQuantityConfirmDialog();
			}
			else {
				//CS-Auftr�ge und Projekte
				this._pushEndOperation();
			}
		},

		_createQuantityConfirmDialog: function () {
			var that = this;
			this._quantityConfirmDialog = new Dialog({
				title: "Mengen Best�tigen",
				type: "Message",
				content: [
					new Label({
						text: "Gutmenge (Gesamt)",
						labelFor: "inputYield"
					}),
					new Input("inputYield", {
						width: "100%",
						placeholder: "0",
						type: "Number",
						value: this.getView().byId("bdeDetailInput7").getValue(),
						submit: function () {
							that._quantityConfirmDialog.getContent().forEach(function (oItem) {
								if (oItem.getId() === "inputYield") {
									that._quantityYield = oItem.getValue();
								}
								if (oItem.getId() === "inputScrap") {
									that._quantityScrap = oItem.getValue();
								}
							});
							var parsedYieldCur,
								parsedYieldGes;
							parsedYieldCur = (that._quantityYield) ? parseInt(that._quantityYield, 10) : "0";
							if (isNaN(parsedYieldCur)) {
								MessageToast.show("Neue Gutmenge konnte nicht in ein Integer umgewandelt werden.");
								return;
							}
							parsedYieldGes = (that.getView().byId("bdeDetailInput12").getValue()) ? parseInt(that.getView().byId("bdeDetailInput12").getValue(),
								10) : "0";
							if (isNaN(parsedYieldGes)) {
								MessageToast.show("Gesamte Gutmenge konnte nicht in ein Integer umgewandelt werden.");
								return;
							}

							if (that._quantityConfirmModus !== "FAP" &&
								that._quantityYield < 1 &&
								that._quantityScrap < 1) {
								MessageToast.show("Ausschuss- oder Gutmenge muss mindestens 1 sein", {
									offset: "0 -400",
									closeOnBrowserNavigation: false
								});
								return;
							}
							//Neue Gutmenge darf nicht kleiner als die vorherige Gutmenge sein
							if (parsedYieldCur < parsedYieldGes) {
								MessageToast.show("Gutmenge darf nicht kleiner sein als aktuelle Gutmenge.");
								return;
							}

							//Mengen aus Popup wieder in normale Mengenfelder schreiben f�r senden der Daten an Backend
							that.byId("bdeDetailInput7").setValue(that._quantityYield);
							that.byId("bdeDetailInput8").setValue(that._quantityScrap);
							//Senden der Daten an Backend
							if (that._quantityConfirmModus === "FAP") {
								that._pushBreakOperation();
							}
							else {
								that._pushEndOperation();
							}
							that._quantityConfirmDialog.close();
						}
					}),
					new Label({
						text: "Ausschussmenge",
						labelFor: "inputScrap"
					}),
					new Input("inputScrap", {
						width: "100%",
						placeholder: "0",
						type: "Number",
						value: this.getView().byId("bdeDetailInput8").getValue(),
						submit: function () {
							that._quantityConfirmDialog.getContent().forEach(function (oItem) {
								if (oItem.getId() === "inputYield") {
									that._quantityYield = oItem.getValue();
								}
								if (oItem.getId() === "inputScrap") {
									that._quantityScrap = oItem.getValue();
								}
							});
							var parsedYieldCur,
								parsedYieldGes;
							parsedYieldCur = (that._quantityYield) ? parseInt(that._quantityYield, 10) : "0";
							if (isNaN(parsedYieldCur)) {
								MessageToast.show("Neue Gutmenge konnte nicht in ein Integer umgewandelt werden.");
								return;
							}
							parsedYieldGes = (that.getView().byId("bdeDetailInput12").getValue()) ? parseInt(that.getView().byId("bdeDetailInput12").getValue(),
								10) : "0";
							if (isNaN(parsedYieldGes)) {
								MessageToast.show("Gesamte Gutmenge konnte nicht in ein Integer umgewandelt werden.");
								return;
							}

							if (that._quantityConfirmModus !== "FAP" &&
								that._quantityYield < 1 &&
								that._quantityScrap < 1) {
								MessageToast.show("Ausschuss- oder Gutmenge muss mindestens 1 sein.", {
									offset: "0 -400",
									closeOnBrowserNavigation: false
								});
								return;
							}
							//Neue Gutmenge darf nicht kleiner als die vorherige Gutmenge sein
							if (parsedYieldCur < parsedYieldGes) {
								MessageToast.show("Gutmenge darf nicht kleiner sein als aktuelle Gutmenge.");
								return;
							}

							//Mengen aus Popup wieder in normale Mengenfelder schreiben f�r senden der Daten an Backend
							that.byId("bdeDetailInput7").setValue(that._quantityYield);
							that.byId("bdeDetailInput8").setValue(that._quantityScrap);
							//Senden der Daten an Backend
							if (that._quantityConfirmModus === "FAP") {
								that._pushBreakOperation();
							}
							else {
								that._pushEndOperation();
							}
							that._quantityConfirmDialog.close();
						}
					})
				],
				beginButton: new Button({
					type: ButtonType.Emphasized,
					text: "Best�tigen",
					press: function () {
						that._quantityConfirmDialog.getContent().forEach(function (oItem) {
							if (oItem.getId() === "inputYield") {
								that._quantityYield = oItem.getValue();
							}
							if (oItem.getId() === "inputScrap") {
								that._quantityScrap = oItem.getValue();
							}
						});
						var parsedYieldCur,
							parsedYieldGes;
						parsedYieldCur = (that._quantityYield) ? parseInt(that._quantityYield, 10) : "0";
						if (isNaN(parsedYieldCur)) {
							MessageToast.show("Neue Gutmenge konnte nicht in ein Integer umgewandelt werden.");
							return;
						}
						parsedYieldGes = (that.getView().byId("bdeDetailInput12").getValue()) ? parseInt(that.getView().byId("bdeDetailInput12").getValue(),
							10) : "0";
						if (isNaN(parsedYieldGes)) {
							MessageToast.show("Gesamte Gutmenge konnte nicht in ein Integer umgewandelt werden.");
							return;
						}

						if (that._quantityConfirmModus !== "FAP" &&
							that._quantityYield < 1 &&
							that._quantityScrap < 1) {
							MessageToast.show("Ausschuss- oder Gutmenge muss mindestens 1 sein.", {
								offset: "0 -400",
								closeOnBrowserNavigation: false
							});
							return;
						}
						//Neue Gutmenge darf nicht kleiner als die vorherige Gutmenge sein
						if (parsedYieldCur < parsedYieldGes) {
							MessageToast.show("Gutmenge darf nicht kleiner sein als aktuelle Gutmenge.");
							return;
						}

						//Mengen aus Popup wieder in normale Mengenfelder schreiben f�r senden der Daten an Backend
						that.byId("bdeDetailInput7").setValue(that._quantityYield);
						that.byId("bdeDetailInput8").setValue(that._quantityScrap);
						//Senden der Daten an Backend
						if (that._quantityConfirmModus === "FAP") {
							that._pushBreakOperation();
						}
						else {
							that._pushEndOperation();
						}
						that._quantityConfirmDialog.close();
					}
				}),
				endButton: new Button({
					text: "Abbrechen",
					press: function () {
						that._quantityConfirmDialog.close();
					}
				}),
				afterClose: function () {
					that._quantityConfirmDialog.destroy();
				}
			});
			this._quantityConfirmDialog.open();
		},

		_pushBreakOperation: function () {
			var that = this;
			this.getView().byId("bdeDetailbutton1").setEnabled(false);
			var oSaveRequestBody = {
				employeeID: this.getView().byId("pzeInput1").getValue(),

				datetime: new Date(),
				productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
				serviceOrder: this.getView().byId("bdeDetailInput13").getValue(),
				operation: this.getView().byId("bdeDetailInput2").getValue(),
				project: this.getView().byId("bdeDetailInput0").getValue(),
				yield: this.getView().byId("bdeDetailInput7").getValue(),
				scrap: this.getView().byId("bdeDetailInput8").getValue()
			};

			//Prepare oParameters
			var oParameters = {
				success: function (oData, response) {
					MessageToast.show("Vorgang erfolgreich pausiert.", {
						offset: "0 -400",
						closeOnBrowserNavigation: false
					});
					that.getView().byId("bdeDetailbutton0").setVisible(true);
					that.getView().byId("bdeDetailbutton1").setVisible(false);
					// that.getView().byId("bdeDetailbutton2").setVisible(false);
					that.getView().byId("bdeDetailbutton3").setVisible(false);
					that.getView().byId("bdeDetailInput7").setEditable(false);
					that.getView().byId("bdeDetailInput8").setEditable(false);
					that.getView().byId("bdeDetailbutton1").setEnabled(true);
					that.onNavBack();
				},
				error: function (oError) {
					that.getView().byId("bdeDetailbutton1").setEnabled(true);
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.create("/OperationPauseSet", oSaveRequestBody, oParameters);
		},

		_pushEndOperation: function () {
			this.getView().byId("bdeDetailbutton3").setEnabled(false);
			var that = this;
			var oSaveRequestBody = {
				employeeID: this.getView().byId("pzeInput1").getValue(),
				datetime: new Date(),
				productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
				serviceOrder: this.getView().byId("bdeDetailInput13").getValue(),
				operation: this.getView().byId("bdeDetailInput2").getValue(),
				project: this.getView().byId("bdeDetailInput0").getValue(),
				yield: this.getView().byId("bdeDetailInput7").getValue(),
				scrap: this.getView().byId("bdeDetailInput8").getValue()
			};

			//Prepare oParameters
			var oParameters = {
				success: function (oData, response) {
					MessageToast.show("Vorgang erfolgreich beendet.", {
						offset: "0 -400",
						closeOnBrowserNavigation: false
					});
					that.getView().byId("bdeDetailbutton0").setVisible(true);
					that.getView().byId("bdeDetailbutton1").setVisible(false);
					// that.getView().byId("bdeDetailbutton2").setVisible(false);
					that.getView().byId("bdeDetailbutton3").setVisible(false);
					that.getView().byId("bdeDetailInput7").setEditable(false);
					that.getView().byId("bdeDetailInput8").setEditable(false);
					that.getView().byId("bdeDetailbutton3").setEnabled(true);
					that.onNavBack();
				},
				error: function (oError) {
					that.getView().byId("bdeDetailbutton3").setEnabled(true);
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.create("/OperationEndSet", oSaveRequestBody, oParameters);
		},

		// onPressMenge: function () {
		// 	this.getView().byId("bdeDetailbutton2").setEnabled(false);
		// 	var that = this;
		// 	if (!this.getView().byId("pzeInput1").getValue()) {
		// 		MessageToast.show("Bitte Mengen eingeben.", {
		// 			closeOnBrowserNavigation: false
		// 		});
		// 		return;
		// 	}
		// 	var oSaveRequestBody = {
		// 		employeeID: this.getView().byId("pzeInput1").getValue(),
		// 		datetime: new Date(),
		// 		productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
		// 		operation: this.getView().byId("bdeDetailInput2").getValue(),
		// 		yield: this.getView().byId("bdeDetailInput7").getValue(),
		// 		scrap: this.getView().byId("bdeDetailInput8").getValue()
		// 	};

		// 	//Prepare oParameters
		// 	var oParameters = {
		// 		success: function (oData, response) {
		// 			MessageToast.show("Mengenr�ckmeldung war erfolgreich.", {
		// 				offset: "0 -400",
		// 				closeOnBrowserNavigation: false
		// 			});
		// 			that.onNavBack();
		// 			that.getView().byId("bdeDetailbutton2").setEnabled(true);
		// 		},
		// 		error: function (oError) {
		// 			var oErrorText = JSON.parse(oError.responseText);
		// 			MessageToast.show(oErrorText.error.message.value, {
		// 				closeOnBrowserNavigation: false
		// 			});
		// 			that.getView().byId("bdeDetailbutton2").setEnabled(true);
		// 		}
		// 	};
		// 	this.oModel.create("/OperationQuantitySet", oSaveRequestBody, oParameters);
		// },

		onPressBeginn: function () {
			this.getView().byId("bdeDetailbutton0").setEnabled(false);
			var that = this;
			var oSaveRequestBody = {
				employeeID: this.getView().byId("pzeInput1").getValue(),
				datetime: new Date(),
				productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
				serviceOrder: this.getView().byId("bdeDetailInput13").getValue(),
				operation: this.getView().byId("bdeDetailInput2").getValue(),
				project: this.getView().byId("bdeDetailInput0").getValue()
			};

			//Prepare oParameters
			var oParameters = {
				success: function (oData, response) {
					if (response.data.multiOperation === "X") {
						// MessageStrip TODO => Daten m�ssen an vorherigen Screen mitgegeben werden
						MessageToast.show("Vorgang erfolgreich begonnen. Mehrmaschinenbedienung Aktiv", {
							offset: "0 -400",
							closeOnBrowserNavigation: false
						});
					}
					else {
						MessageToast.show("Vorgang erfolgreich begonnen.", {
							offset: "0 -400",
							closeOnBrowserNavigation: false
						});
					}

					that.getView().byId("bdeDetailbutton0").setVisible(false);
					that.getView().byId("bdeDetailbutton1").setVisible(true);
					that.getView().byId("bdeDetailbutton3").setVisible(true);
					that.getView().byId("bdeDetailInput7").setEditable(true);
					that.getView().byId("bdeDetailInput8").setEditable(true);
					that.getView().byId("bdeDetailbutton0").setEnabled(true);
					that.onNavBack();
				},
				error: function (oError) {
					that.getView().byId("bdeDetailbutton0").setEnabled(true);
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.create("/OperationBeginSet", oSaveRequestBody, oParameters);
		},

		onPressBearbeiten: function () {
			var input = this.getView().byId("bdeInput0").getValue();
			if (!input) {
				MessageToast.show("Bitte Nummer zum Bearbeiten eingeben.", {
					closeOnBrowserNavigation: false
				});
				return;
			}
			this.determineDocType(input);
		},

		onBearbeitenSubmit: function () {
			var input = this.getView().byId("bdeInput0").getValue();
			if (!input) {
				MessageToast.show("Bitte Nummer zum Bearbeiten eingeben.", {
					closeOnBrowserNavigation: false
				});
				jQuery.sap.delayedCall(500, this, function () {
					this.byId("bdeInput0").focus();
				});
				return;
			}
			this.determineDocType(input);
		},

		determineDocType: function (input) {
			var that = this;
			//Prepare aFilters
			var aFilters = [
				new Filter({
					path: "employeeID",
					operator: FilterOperator.EQ,
					value1: this.getView().byId("pzeInput1").getValue()
				}),
				new Filter({
					path: "datetime",
					operator: FilterOperator.EQ,
					value1: new Date()
				}),
				new Filter({
					path: "input",
					operator: FilterOperator.EQ,
					value1: input
				})
			];

			//Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					that.operationDetailResult(response.data.results[0]);
					that.getView().byId("filter2").setVisible(true);
					that.getView().byId("bar0").setSelectedKey("__xmlview1--filter2");
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
					// that.getView().byId("bdeInput0").focus();
					jQuery.sap.delayedCall(500, that, function () {
						that.byId("bdeInput0").focus();
					});
				}
			};
			this.oModel.read("/OperationDetailsSet", oParameters);
		},

		operationDetailResult: function (result) {
			//Artikel
			this.getView().byId("bdeDetailInput3").setValue(result.product);
			//Kunde
			this.getView().byId("bdeDetailInput4").setValue(result.customer);
			//Arbeitsplatz
			this.getView().byId("bdeDetailInput5").setValue(result.workstation);
			//Langtext
			this.getView().byId("bdeDetailInput6").setValue(result.longtext);
			//Zeit Soll
			this.getView().byId("bdeDetailInput9").setValue(result.targetTime);
			//Zeit Ist
			this.getView().byId("bdeDetailInput10").setValue(result.actualTime);
			//Menge Soll
			this.getView().byId("bdeDetailInput11").setValue(result.targetQuantity);
			//Menge Ist
			this.getView().byId("bdeDetailInput12").setValue(result.actualQuantity);

			this.getView().byId("bdeDetailInput0").setValue("");
			this.getView().byId("bdeDetailInput1").setValue("");
			this.getView().byId("bdeDetailInput2").setValue("");
			this.getView().byId("bdeDetailInput13").setValue("");
			this.getView().byId("bdeDetailInput7").setValue("");
			this.getView().byId("bdeDetailInput8").setValue("");

			if (result.productionOrder) {
				this.getView().byId("bdeDetailInput1").setValue(result.productionOrder);
				this.getView().byId("bdeDetailInput2").setValue(result.operation);
				this.getView().byId("bdeDetailElement0").setVisible(false);
				this.getView().byId("bdeDetailInput1").setVisible(true);
				this.getView().byId("bdeDetailInput2").setVisible(true);
				this.getView().byId("bdeDetailInput13").setVisible(false);
				this.getView().byId("lblDetailFA").setVisible(true);
				this.getView().byId("lblDetailCS").setVisible(false);
				this.getView().byId("lblDetailOP").setVisible(true);
				//Mengenr�ckmeldung
				this.getView().byId("bdeDetailElement7").setVisible(true);
				this.getView().byId("bdeDetailElement8").setVisible(true);
				//Soll/Ist
				this.getView().byId("lblMengeSoll").setVisible(true);
				this.getView().byId("lblMengeIst").setVisible(true);
				this.getView().byId("lblZeitSoll").setVisible(true);
				this.getView().byId("lblZeitIst").setVisible(true);
				this.getView().byId("bdeDetailInput9").setVisible(true);
				this.getView().byId("bdeDetailInput10").setVisible(true);
				this.getView().byId("bdeDetailInput11").setVisible(true);
				this.getView().byId("bdeDetailInput12").setVisible(true);
				//Arbeitsplatz
				this.getView().byId("bdeDetailInput5").setEditable(false);
				this.getView().byId("btWorkstationChange").setVisible(true);
				this.getView().byId("btWorkstationSave").setVisible(false);
				this.getView().byId("btWorkstationCancel").setVisible(false);
			}
			else if (result.serviceOrder) {
				this.getView().byId("bdeDetailInput13").setValue(result.serviceOrder);
				this.getView().byId("bdeDetailInput2").setValue(result.operation);
				this.getView().byId("bdeDetailElement0").setVisible(false);
				this.getView().byId("bdeDetailInput1").setVisible(false);
				this.getView().byId("bdeDetailInput2").setVisible(true);
				this.getView().byId("bdeDetailInput13").setVisible(true);
				this.getView().byId("lblDetailFA").setVisible(false);
				this.getView().byId("lblDetailCS").setVisible(true);
				this.getView().byId("lblDetailOP").setVisible(true);
				//Mengenr�ckmeldung
				this.getView().byId("bdeDetailElement7").setVisible(false);
				this.getView().byId("bdeDetailElement8").setVisible(false);
				//Soll/Ist
				this.getView().byId("lblMengeSoll").setVisible(false);
				this.getView().byId("lblMengeIst").setVisible(false);
				this.getView().byId("lblZeitSoll").setVisible(true);
				this.getView().byId("lblZeitIst").setVisible(true);
				this.getView().byId("bdeDetailInput9").setVisible(true);
				this.getView().byId("bdeDetailInput10").setVisible(true);
				this.getView().byId("bdeDetailInput11").setVisible(false);
				this.getView().byId("bdeDetailInput12").setVisible(false);
				//Arbeitsplatz
				this.getView().byId("bdeDetailInput5").setEditable(false);
				this.getView().byId("btWorkstationChange").setVisible(false);
				this.getView().byId("btWorkstationSave").setVisible(false);
				this.getView().byId("btWorkstationCancel").setVisible(false);
			}
			else {
				this.getView().byId("bdeDetailInput0").setValue(result.project);
				this.getView().byId("bdeDetailElement0").setVisible(true);
				this.getView().byId("bdeDetailInput1").setVisible(false);
				this.getView().byId("bdeDetailInput2").setVisible(false);
				this.getView().byId("bdeDetailInput13").setVisible(false);
				this.getView().byId("lblDetailFA").setVisible(false);
				this.getView().byId("lblDetailCS").setVisible(false);
				this.getView().byId("lblDetailOP").setVisible(false);
				//Mengenr�ckmeldung
				this.getView().byId("bdeDetailElement7").setVisible(false);
				this.getView().byId("bdeDetailElement8").setVisible(false);
				//Soll/Ist
				this.getView().byId("lblMengeSoll").setVisible(false);
				this.getView().byId("lblMengeIst").setVisible(false);
				this.getView().byId("lblZeitSoll").setVisible(true);
				this.getView().byId("lblZeitIst").setVisible(true);
				this.getView().byId("bdeDetailInput9").setVisible(true);
				this.getView().byId("bdeDetailInput10").setVisible(true);
				this.getView().byId("bdeDetailInput11").setVisible(false);
				this.getView().byId("bdeDetailInput12").setVisible(false);
				//Arbeitsplatz
				this.getView().byId("bdeDetailInput5").setEditable(false);
				this.getView().byId("btWorkstationChange").setVisible(false);
				this.getView().byId("btWorkstationSave").setVisible(false);
				this.getView().byId("btWorkstationCancel").setVisible(false);
			}

			if (result.tmvnt === "PSB" ||
				result.tmvnt === "CSB" ||
				result.tmvnt === "FAB") {
				this.getView().byId("bdeDetailbutton0").setVisible(false);
				this.getView().byId("bdeDetailbutton1").setVisible(true);
				this.getView().byId("bdeDetailbutton3").setVisible(true);
				this.getView().byId("bdeDetailInput7").setEditable(true);
				this.getView().byId("bdeDetailInput8").setEditable(true);
				if (result.tmvnt === "FAB") {
					// this.getView().byId("bdeDetailbutton2").setVisible(true);
					this.getView().byId("btWorkstationChange").setVisible(false);
				}
				// else {
				// 	// this.getView().byId("bdeDetailbutton2").setVisible(false);
				// 	this.getView().byId("btWorkstationChange").setVisible(true);
				// }
			}
			else {
				this.getView().byId("bdeDetailbutton0").setVisible(true);
				this.getView().byId("bdeDetailbutton1").setVisible(false);
				this.getView().byId("bdeDetailbutton3").setVisible(false);
				this.getView().byId("bdeDetailInput7").setEditable(false);
				this.getView().byId("bdeDetailInput8").setEditable(false);
			}
		},

		onPressWorkstationChange: function () {
			this.workstationValue = this.getView().byId("bdeDetailInput5").getValue();
			this.getView().byId("btWorkstationChange").setVisible(false);
			this.getView().byId("btWorkstationSave").setVisible(true);
			this.getView().byId("btWorkstationCancel").setVisible(true);
			this.getView().byId("bdeDetailInput5").setEditable(true);
			this.getView().byId("bdeDetailInput5").setValue(this.workstationValue.charAt(0));
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

		onWorkstationSubmit: function (oEvent) {
			var that = this;
			if (this.workstationValue === this.getView().byId("bdeDetailInput5").getValue()) {
				return;
			}
			// var that = this;
			var oSaveRequestBody = {
				productionOrder: this.getView().byId("bdeDetailInput1").getValue(),
				operation: this.getView().byId("bdeDetailInput2").getValue(),
				workstation: this.getView().byId("bdeDetailInput5").getValue()
			};

			//Prepare oParameters
			var oParameters = {
				success: function (oData, response) {
					MessageToast.show("Arbeitsplatz wurde erfolgreich ge�ndert", {
						closeOnBrowserNavigation: false
					});
					that.getView().byId("btWorkstationChange").setVisible(true);
					that.getView().byId("btWorkstationSave").setVisible(false);
					that.getView().byId("btWorkstationCancel").setVisible(false);
					that.getView().byId("bdeDetailInput5").setEditable(false);
				},
				error: function (oError) {
					that.getView().byId("bdeDetailInput5").setValue(this.workstationValue.charAt(0)); //INS DERIHM 01.09.2020 Value wieder auf vorher setzen
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.create("/WorkstationChangeSet", oSaveRequestBody, oParameters);
		},

		getLastOperationsList: function () {
			var that = this;
			//Prepare aFilters
			var aFilters = [
				new Filter({
					path: "employeeID",
					operator: FilterOperator.EQ,
					value1: this.getView().byId("pzeInput1").getValue()
				}),
				new Filter({
					path: "datetime",
					operator: FilterOperator.EQ,
					value1: new Date()
				})
			];

			//Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					that.addLastOperationItems(response.data.results);
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.read("/OperationSet", oParameters);
		},

		getCurrentOperationsList: function () {
			var that = this;
			//Prepare aFilters
			var aFilters = [
				new Filter({
					path: "employeeID",
					operator: FilterOperator.EQ,
					value1: this.getView().byId("pzeInput1").getValue()
				}),
				new Filter({
					path: "datetime",
					operator: FilterOperator.EQ,
					value1: new Date()
				})
			];

			//Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					that.addCurrentOperationsItems(response.data.results);
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.read("/OperationsCurrentSet", oParameters);
		},

		addCurrentOperationsItems: function (results) {
			var that = this;
			var oSelectList = that.getView().byId("bdeList1");
			oSelectList.removeAllItems();
			results.forEach(function (item) {
				var text;
				var oItem = new sap.m.StandardListItem();
				if (item.productionOrder) {
					text = item.productionOrder + "-" + item.operation;
					oItem.setTitle("Fertigungsauftrag: ");
					oItem.setDescription(text);
				}
				else if (item.serviceOrder) {
					text = item.serviceOrder + "-" + item.operation;
					oItem.setTitle("Serviceauftrag: ");
					oItem.setDescription(text);
				}
				else {
					oItem.setTitle("Projekt: ");
					oItem.setDescription(item.project);
				}
				oItem.setType("Navigation");
				oSelectList.addItem(oItem);
			});
		},

		addLastOperationItems: function (results) {
			var that = this;
			var oSelectList = that.getView().byId("bdeList0");
			oSelectList.removeAllItems();
			results.forEach(function (item) {
				var oItem = new sap.m.StandardListItem();
				if (item.productionOrder) {
					var text = item.productionOrder + "-" + item.operation;
					oItem.setTitle("Fertigungsauftrag: ");
					oItem.setDescription(text);
				}
				else if (item.serviceOrder) {
					text = item.serviceOrder + "-" + item.operation;
					oItem.setTitle("Serviceauftrag: ");
					oItem.setDescription(text);
				}
				else {
					oItem.setTitle("Projekt: ");
					oItem.setDescription(item.project);
				}
				oItem.setType("Navigation");
				oSelectList.addItem(oItem);
			});
		},

		onNavBack: function () {
			this.getView().invalidate();
			this._navBackIsClicked = true;
			// console.log(this.idleTimer);
			clearTimeout(this.idleTimer);
			// console.log("IdleTimer sollte gecleared sein");
			// console.log(new Date());
			// console.log(this.idleTimer);
			// $(document.body).unbind('mousemove keydown click');
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Login", {}, true);
			// this.getView().destroy();
		},

		onKommen: function () {
			this.getView().byId("pzeButton0").setEnabled(false);
			this.createODataRequest("/onKommenSet", false);
		},

		onGehen: function () {
			this.getView().byId("pzeButton1").setEnabled(false);
			this.createODataRequest("/onGehenSet", false);
		},

		createODataRequest: function (sPath, bBeginConfirm) {
			var that = this;
			//Prepare oParameters
			var oParameters = {
				success: function (oData, response) {
					//Timeline mit neuem Item bef�llen
					that.addTimelineItem(response.data, sPath);
					that.onNavBack();
					var kommenText = "Kommen erfolgreich gebucht.";
					var gehenText = "Gehen erfolgreich gebucht.";
					if (response.data.autoBreak > 0) {
						gehenText = gehenText + "Es wurden " + response.data.autoBreak + " Vorg�nge automatisch beendet.";
					}
					MessageToast.show((sPath === "/onKommenSet") ? kommenText : gehenText, {
						offset: "0 -400",
						closeOnBrowserNavigation: false
					});
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					if (oErrorText.error.message.value === "pushConfirmationPopup") {
						//INS DERIHM 15.02.2021
						that._createPzeStartConfirmDialog();
					}
					else {
						MessageToast.show(oErrorText.error.message.value, {
							closeOnBrowserNavigation: false
						});
					}
					that.getView().byId("pzeButton0").setEnabled(true);
					that.getView().byId("pzeButton1").setEnabled(true);
				}
			};

			var oSaveRequestBody = {
				employeeID: this.getView().byId("pzeInput1").getValue(),
				datetime: new Date()
			};
			if (sPath === "/onKommenSet") {
				oSaveRequestBody.beginConfirm = bBeginConfirm;
			}
			this.oModel.create(sPath, oSaveRequestBody, oParameters);
		},

		_createPzeStartConfirmDialog: function () {
			if (!this._pzeStartConfirmDialog) {
				this._pzeStartConfirmDialog = new Dialog({
					type: "Message",
					title: "Kommen erneut buchen?",
					content: new Text({
						text: "Ihre vorige Buchung war ebenfalls KOMMT. M�chten Sie wirklich KOMMT buchen?"
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Ja",
						press: function () {
							this.createODataRequest("/onKommenSet", true);
							this._pzeStartConfirmDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Abbruch",
						press: function () {
							this._pzeStartConfirmDialog.close();
						}.bind(this)
					})
				});
			}
			this._pzeStartConfirmDialog.open();
		},

		setViewParameters: function (oEvent) {
			this.getView().byId("pzeInput0").setValue(oEvent.getParameter("arguments").timeID);
			this.getView().byId("pzeInput1").setValue(oEvent.getParameter("arguments").employeeID);
			this.getView().byId("pzeInput2").setValue(oEvent.getParameter("arguments").name);
		},

		getHrEvents: function () {
			var that = this;
			//Prepare aFilters
			var aFilters = [
				new Filter({
					path: "employeeID",
					operator: FilterOperator.EQ,
					value1: this.getView().byId("pzeInput1").getValue()
				}),
				new Filter({
					path: "datetime",
					operator: FilterOperator.EQ,
					value1: new Date()
				})
			];

			//Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					//Timeline mit Items bef�llen
					that.addTimelineItems(response.data.results);
				},
				error: function (oError) {
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						closeOnBrowserNavigation: false
					});
				}
			};
			this.oModel.read("/KommenInitSet", oParameters);
		},

		addTimelineItems: function (results) {
			var that = this;
			var oTimeline = that.getView().byId("pzeTimeline");
			oTimeline.removeAllContent();
			results.forEach(function (item) {
				var oContent = new sap.suite.ui.commons.TimelineItem();
				if (item.tmvnt === "HRK") {
					oContent.setTitle("Kommen");
				}
				else {
					oContent.setTitle("Gehen");
				}
				oContent.setDateTime(item.datetime);
				oTimeline.addContent(oContent);
			});
		},

		addTimelineItem: function (result, sPath) {
			var that = this;
			var oTimeline = that.getView().byId("pzeTimeline");
			var oContent = new sap.suite.ui.commons.TimelineItem();
			if (sPath === "/onKommenSet") {
				oContent.setTitle("Kommen");
			}
			else {
				oContent.setTitle("Gehen");
			}
			oContent.setDateTime(result.datetime);
			oTimeline.addContent(oContent);
		},

		/*		changeButtonActivity(result) {
					if (result.tmvnt == 'HRK') {
						this.getView().byId("pzeButton0").setEnabled(false);
						this.getView().byId("pzeButton1").setEnabled(true);
					}
					else {
						this.getView().byId("pzeButton0").setEnabled(true);
						this.getView().byId("pzeButton1").setEnabled(false);
					}
				}*/

		/*
		Table Functions
		*/

		onExit: function () {
			var oDialogKey,
				oDialogValue;

			for (oDialogKey in this._mViewSettingsDialogs) {
				oDialogValue = this._mViewSettingsDialogs[oDialogKey];

				if (oDialogValue) {
					oDialogValue.destroy();
				}
			}
		},

		createViewSettingsDialog: function (sDialogFragmentName) {
			var oDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
				this._mViewSettingsDialogs[sDialogFragmentName] = oDialog;

				if (Device.system.desktop) {
					oDialog.addStyleClass("sapUiSizeCompact");
				}
			}
			return oDialog;
		},

		// PZE Overview Functions

		handleSortButtonPressed: function () {
			this.createViewSettingsDialog("ZAHR_PZEBDE.ZAHR_PZEBDE.view.SortDialog").open();
		},

		handleFilterButtonPressed: function () {
			this.createViewSettingsDialog("ZAHR_PZEBDE.ZAHR_PZEBDE.view.FilterDialog").open();
		},

		handleGroupButtonPressed: function () {
			this.createViewSettingsDialog("ZAHR_PZEBDE.ZAHR_PZEBDE.view.GroupDialog").open();
		},

		handleSortDialogConfirm: function (oEvent) {
			var oTable = this.byId("pzeOvTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			var oSorter = new sap.ui.model.Sorter(sPath, bDescending);
			aSorters.push(oSorter);

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		handleFilterDialogConfirm: function (oEvent) {
			var oTable = this.byId("pzeOvTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				aFilters = [];

			mParams.filterItems.forEach(function (oItem) {
				var aSplit = oItem.getKey().split("___"),
					sPath = aSplit[0],
					sOperator = aSplit[1],
					sValue1 = aSplit[2],
					sValue2 = aSplit[3],
					oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
				aFilters.push(oFilter);
			});

			// apply filter settings
			oBinding.filter(aFilters);

			// update filter bar
			this.byId("vsdFilterBar").setVisible(aFilters.length > 0);
			this.byId("vsdFilterLabel").setText(mParams.filterString);
		},

		handleGroupDialogConfirm: function (oEvent) {
			var oTable = this.byId("pzeOvTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				vGroup,
				aGroups = [];
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				vGroup = this.mGroupFunctions[sPath];
				aGroups.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
				// aGroups.push(new sap.ui.model.Sorter(sPath, bDescending, true));
				// apply the selected group settings
				oBinding.sort(aGroups);
			}
		},

		// BDE Overview Functions

		handleSortButtonPressedBde: function () {
			this.createViewSettingsDialog("ZAHR_PZEBDE.ZAHR_PZEBDE.view.SortDialogBde").open();
		},

		handleFilterButtonPressedBde: function () {
			this.createViewSettingsDialog("ZAHR_PZEBDE.ZAHR_PZEBDE.view.FilterDialogBde").open();
		},

		handleGroupButtonPressedBde: function () {
			this.createViewSettingsDialog("ZAHR_PZEBDE.ZAHR_PZEBDE.view.GroupDialogBde").open();
		},

		handleSortDialogConfirmBde: function (oEvent) {
			var oTable = this.byId("bdeOvTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			var oSorter = new sap.ui.model.Sorter(sPath, bDescending);
			aSorters.push(oSorter);

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		handleFilterDialogConfirmBde: function (oEvent) {
			var oTable = this.byId("bdeOvTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				aFilters = [];

			mParams.filterItems.forEach(function (oItem) {
				var aSplit = oItem.getKey().split("___"),
					sPath = aSplit[0],
					sOperator = aSplit[1],
					sValue1 = aSplit[2],
					sValue2 = aSplit[3],
					oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
				aFilters.push(oFilter);
			});

			// apply filter settings
			oBinding.filter(aFilters);

			// update filter bar
			this.byId("vsdFilterBar").setVisible(aFilters.length > 0);
			this.byId("vsdFilterLabel").setText(mParams.filterString);
		},

		handleGroupDialogConfirmBde: function (oEvent) {
			var oTable = this.byId("bdeOvTable"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				vGroup,
				aGroups = [];
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				vGroup = this.mGroupFunctions[sPath];
				aGroups.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
				// aGroups.push(new sap.ui.model.Sorter(sPath, bDescending, true));
				// apply the selected group settings
				oBinding.sort(aGroups);
			}
		}

		// *************************************************
		// Value Help Working Station
		// *************************************************

		// _configDialog: function (oButton) {
		// 	// Multi-select if required
		// 	var bMultiSelect = !!oButton.data("multi");
		// 	this._oDialog.setMultiSelect(bMultiSelect);

		// 	var sCustomConfirmButtonText = oButton.data("confirmButtonText");
		// 	this._oDialog.setConfirmButtonText(sCustomConfirmButtonText);

		// 	// Remember selections if required
		// 	var bRemember = !!oButton.data("remember");
		// 	this._oDialog.setRememberSelections(bRemember);

		// 	//add Clear button if needed
		// 	var bShowClearButton = !!oButton.data("showClearButton");
		// 	this._oDialog.setShowClearButton(bShowClearButton);

		// 	// Set growing property
		// 	var bGrowing = oButton.data("growing");
		// 	this._oDialog.setGrowing(bGrowing === "true");

		// 	// Set growing threshold
		// 	var sGrowingThreshold = oButton.data("threshold");
		// 	if (sGrowingThreshold) {
		// 		this._oDialog.setGrowingThreshold(parseInt(sGrowingThreshold));
		// 	}

		// 	// Set draggable property
		// 	var bDraggable = oButton.data("draggable");
		// 	this._oDialog.setDraggable(bDraggable === "true");

		// 	// Set draggable property
		// 	var bResizable = oButton.data("resizable");
		// 	this._oDialog.setResizable(bResizable === "true");

		// 	// clear the old search filter
		// 	this._oDialog.getBinding("items").filter([]);

		// 	// toggle compact style
		// 	jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		// },

		// handleSearch: function (oEvent) {
		// 	var sValue = oEvent.getParameter("value");
		// 	var oFilter = new Filter("Name", FilterOperator.Contains, sValue);
		// 	var oBinding = oEvent.getSource().getBinding("items");
		// 	oBinding.filter([oFilter]);
		// },

		// handleClose: function (oEvent) {
		// 	var aContexts = oEvent.getParameter("selectedContexts");
		// 	if (aContexts && aContexts.length) {
		// 		MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
		// 			return oContext.getObject().Name;
		// 		}).join(", "));
		// 	}
		// 	else {
		// 		MessageToast.show("No new item was selected.");
		// 	}
		// 	oEvent.getSource().getBinding("items").filter([]);
		// },

		// handleValueHelp: function () {
		// 	var that = this;

		// 	var oParameters = {
		// 		success: function (oData, response) {
		// 			that.getView().getModel().setData({
		// 				workStationCollection: oData.results
		// 			});
		// 			if (!that._oValueHelpDialog) {
		// 				Fragment.load({
		// 					name: "ZAHR_PZEBDE.ZAHR_PZEBDE.view.ValueHelp",
		// 					controller: that
		// 				}).then(function (oValueHelpDialog) {
		// 					that._oValueHelpDialog = oValueHelpDialog;
		// 					that.getView().addDependent(this._oValueHelpDialog);
		// 					that._configValueHelpDialog();
		// 					that._oValueHelpDialog.open();
		// 				}.bind(that));
		// 			}
		// 			else {
		// 				that._configValueHelpDialog();
		// 				that._oValueHelpDialog.open();
		// 			}
		// 		},
		// 		error: function (oError) {
		// 			var oErrorText = JSON.parse(oError.responseText);
		// 			MessageToast.show(oErrorText.error.message.value, {
		// 				closeOnBrowserNavigation: false
		// 			});
		// 		}
		// 	};
		// 	this.oModel.read("/workstationSearchHelpSet", oParameters);
		// },

		// _configValueHelpDialog: function () {
		// 	var sInputValue = this.byId("bdeDetailInput5").getValue(),
		// 		oModel = this.getView().getModel(),
		// 		aWorkStations = oModel.getProperty("/workStationCollection");

		// 	aWorkStations.forEach(function (oProduct) {
		// 		oProduct.selected = (oProduct.Name === sInputValue);
		// 	});
		// 	oModel.setProperty("/workStationCollection", aWorkStations);
		// },

		// handleValueHelpClose: function (oEvent) {
		// 	var oSelectedItem = oEvent.getParameter("selectedItem"),
		// 		oInput = this.byId("bdeDetailInput5");

		// 	if (oSelectedItem) {
		// 		this.byId("bdeDetailInput5").setValue(oSelectedItem.getTitle());
		// 	}

		// 	if (!oSelectedItem) {
		// 		oInput.resetProperty("value");
		// 	}
		// }

		// fnFormatter: function (text, key) {
		// 	var sText = "";

		// 	if (text && key) {
		// 		sText += (text + " (" + key + ")");
		// 	}
		// 	else if (text) {
		// 		sText += text;
		// 	}
		// 	else if (key) {
		// 		sText += key;
		// 	}

		// 	return sText;
		// }

		// checkOperationInput: function () {
		// 	if (!this.getView().byId("pzeInput0").getValue() &&
		// 		!this.getView().byId("pzeInput1").getValue()) {
		// 		MessageBox.show("Entweder der FA oder das PS muss gef�llt sein");
		// 		return false;
		// 	}
		// 	if (this.getView().byId("pzeInput1").getValue() &&
		// 		!this.getView().byId("pzeInput2").getValue()) {
		// 		MessageBox.show("Vorgangsnummer muss gef�llt sein");
		// 		return false;
		// 	}
		// 	return true;
		// },

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.PZEBDE
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.PZEBDE
		 */

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.PZEBDE
		 */
		//	onExit: function() {
		//
		//	}

	});
});