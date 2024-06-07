sap.ui.define([
	"ZAHR_PZEBDE/ZAHR_PZEBDE/controller/BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast"
], function (BaseController, Filter, FilterOperator, MessageToast) {
	"use strict";

	return BaseController.extend("ZAHR_PZEBDE.ZAHR_PZEBDE.controller.Login", {

		clockRefresh: 1000,
		clockTimer: null,
		inputRefresh: 5000,
		inputTimer: null,
		// inputClearInterval: null,
		// clockInterval: null,
		_intervalId: null,
		_userLanguage: null,

		onInit: function () {
			var that = this;
			//Get Router
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getRoute("Login").attachMatched(this.onRouteMatched, this);

			//Get Service Url for OData Read
			var sServiceUrl = this.getOwnerComponent().getManifestEntry("sap.app").dataSources["ZAHR_PZEBDE_GET_FA_PSP_SRV"].uri;
			this.oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);

			jQuery.sap.delayedCall(500, this, function () {
				this.byId("inputTimeID").focus();
			});
			this.clearAusweisnummerInput();
			this.setDatetime();

			this.getView().byId("inputTimeID").addEventDelegate({
				onfocusout: function () {
					that.byId("inputTimeID").focus();
				}
			});
			this._getUserLanguage();
		},

		_redirectToCorrectLanguage: function () {
			var sLang = this._userLanguage;
			var sUrl = window.location.href;
			var pattern = "sap-language=" + sLang;
			if (sUrl.search(pattern) >= 0) return;
			var sNewUrl = this._replaceUrlParam(sUrl, "sap-language", sLang);
			window.location.replace(sNewUrl);
		},

		_replaceUrlParam: function (url, paramName, paramValue) {
			var param = paramName + "=" + paramValue;
			var pattern = new RegExp("sap-language=.");
			if (url.search(pattern) >= 0) {
				return url.replace(pattern, param);
				// return url.replace(pattern, "$1" + paramValue + "$2");
			}
			var aSplits = url.split("#");
			var sSep = (url.includes("?")) ? "&" : "?";
			return aSplits[0] + sSep + param + "#" + aSplits[1];
		},

		_getUserLanguage: function () {
			var that = this;
			
			//Prepare aFilters
			var aFilters = [];
			var oReadFilter = new Filter({
				path: "userID",
				operator: FilterOperator.EQ,
				value1: sap.ushell.Container.getService("UserInfo").getId()
			});
			aFilters.push(oReadFilter);
			
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					that._userLanguage = response.data.results[0].language;
					that._redirectToCorrectLanguage();
				},
				error: function (oError) {
					that._userLanguage = "";
				}
			};

			// Read OData for Login
			this.oModel.read("/UserLanguageSet", oParameters);
		},

		setDatetime: function () {
			var that = this;
			var currentDate = new Date(),
				currentMonth = (((currentDate.getMonth() + 1) < 10) ? "0" + (currentDate.getMonth() + 1) : (currentDate.getMonth() + 1)),
				currentYear = currentDate.getYear() + 1900,
				currentDay = ((currentDate.getDate() < 10) ? "0" + currentDate.getDate() : currentDate.getDate()),
				dateFormatted = currentDay + "." + currentMonth + "." + currentYear,
				currentSecond = ((currentDate.getSeconds() < 10) ? "0" + currentDate.getSeconds() : currentDate.getSeconds()),
				currentHour = ((currentDate.getHours() < 10) ? "0" + currentDate.getHours() : currentDate.getHours()),
				currentMinute = ((currentDate.getMinutes() < 10) ? "0" + currentDate.getMinutes() : currentDate.getMinutes());
			dateFormatted = currentHour + ":" + currentMinute + ":" + currentSecond + " " + dateFormatted;
			this.getView().byId("labelDateTime").setText(dateFormatted);
			this.clockTimer = setTimeout(function () {
				that.setDatetime();
			}, this.clockRefresh);
		},

		clearAusweisnummerInput: function () {
			var that = this;
			if (this.getView().byId("inputTimeID").getValue("")) this.getView().byId("inputTimeID").setValue("");
			this.inputTimer = setTimeout(function () {
				that.clearAusweisnummerInput();
			}, this.inputRefresh);
		},

		onRouteMatched: function (oEvent) {
			var that = this;
			this.getView().byId("inputTimeID").setValue("");
			jQuery.sap.delayedCall(500, this, function () {
				this.byId("inputTimeID").focus();
			});
			// this.applyInitialFocusTo(this.byId("inputTimeID"));
		},

		onInputLiveChange: function (oEvent) {
			var that = this;
			clearTimeout(this.inputTimer);
			this.inputTimer = setTimeout(function () {
				that.clearAusweisnummerInput();
			}, this.inputRefresh);
			if (this.getView().byId("inputTimeID").getValue().length === 14) {
				this.onLogin(oEvent);
			}
		},

		onInputSubmit: function (oEvent) {
			this.onLogin(oEvent);
		},

		onLogin: function (oEvent) {
			this.getView().byId("buttonLogin").setEnabled(false);
			var that = this;
			if (!this.getView().byId("inputTimeID").getValue()) {
				MessageToast.show("Ausweisnummer darf nicht leer sein.", {
					offset: "0 -300",
					closeOnBrowserNavigation: false
				});
				this.getView().byId("buttonLogin").setEnabled(true);
				this.getView().byId("inputTimeID").setValue("");
				return;
			}

			//Get login time ID
			var timeID = this.getView().byId("inputTimeID").getValue();

			//Prepare aFilters
			var aFilters = [];
			var oReadFilter = new Filter({
				path: "timeID",
				operator: FilterOperator.EQ,
				value1: timeID
			});
			aFilters.push(oReadFilter);

			// Prepare oParameters
			var oParameters = {
				filters: aFilters,
				success: function (oData, response) {
					// this.oRouter.getTargets().display("PZEBDE");
					
					that.oRouter.navTo("PZEBDE", {
						timeID: response.data.results[0].timeID,
						employeeID: response.data.results[0].employeeID,
						name: response.data.results[0].name
					}, true);
					that.getView().byId("buttonLogin").setEnabled(true);
					// clearInterval(that.clockIntervall);
					// clearInterval(that.inputClearIntervall);
				},
				error: function (oError) {
					that.getView().byId("buttonLogin").setEnabled(true);
					var oErrorText = JSON.parse(oError.responseText);
					MessageToast.show(oErrorText.error.message.value, {
						offset: "0 -300",
						closeOnBrowserNavigation: false
					});
					that.getView().byId("inputTimeID").setValue("");
				}
			};

			// Read OData for Login
			this.oModel.read("/LoginSet", oParameters);
		},

		// applyInitialFocusTo: function (target) {
		// 	var onAfterShow = function () {
		// 		target.focus();
		// 	};
		// 	this.getView().addEventDelegate({
		// 		onAfterShow
		// 	});
		// },

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.Login
		 */
		//	onBeforeRendering: function() {
		//
		//	}

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.Login
		 */
		onAfterRendering: function () {
			jQuery.sap.delayedCall(500, this, function () {
				this.byId("inputTimeID").focus();
			});
			// 	this.getView().byId("buttonLogin").addStyleClass("myCustomButton");
		}

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf ZAHR_PZEBDE.ZAHR_PZEBDE.view.Login
		 */
		//	onExit: function() {
		//
		//	}

	});

});