sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/m/Dialog",
		"sap/m/DialogRenderer",
		"sap/ui/layout/form/SimpleForm",
		"sap/m/Label",
		"sap/m/Input",
		"sap/m/InputType",
		"sap/m/DatePicker",
		"sap/m/HBox",
		"sap/m/RadioButton",
		"sap/m/TimePicker",
		"sap/m/Button",
		"sap/m/NavContainer",
		"sap/m/Page",
		"sap/m/TabContainer",
		"sap/m/TabContainerItem",
		"sap/m/Table",
		"sap/m/Column",
		"sap/m/ColumnListItem",
		"sap/m/ListMode",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter"
	],
	function (Controller, Dialog, DialogRenderer, SimpleForm, Label, Input, InputType, DatePicker, HBox, RadioButton, TimePicker, Button,
		NavContainer, Page, TabContainer, TabContainerItem, Table, Column, ColumnListItem, ListMode, Filter, FilterOperator, Sorter) {
		"use strict";

		return Dialog.extend("control.F4ValueHelp", {

			metadata: {
				properties: {
					title: {
						type: "string",
						defaultValue: "Suchhilfe"
					},
					serviceModel: {
						type: "object"
					},
					modelPaths: {
						type: "string[]"
					},
					contentHeight: {
						type: "sap.ui.core.CSSSize",
						defaultValue: "50%"
					},
					contentWidth: {
						type: "sap.ui.core.CSSSize",
						defaultValue: "50%"
					},
					resizable: {
						type: "Boolean",
						defaultValue: true
					},
					draggable: {
						type: "Boolean",
						defaultValue: false
					},
					showHeader: {
						type: "Boolean",
						defaultValue: false
					}
				}
			},

			_helpModel: {},

			_navContainer: undefined,
			_tabContainer: undefined,
			_tablePage: undefined,
			_tablePageTable: undefined,

			_selectedKeys: {},

			init: function () {
				this.attachAfterClose(this.afterClose);

				this.setTitle(this.getTitle());
				this.setStretch(sap.ui.Device.system.phone);

				this.addButton(new Button({
					text: "Suche starten",
					press: function () {
						this.navigate();
					}.bind(this)
				}));

				this.addButton(new Button({
					text: "Schließen",
					press: function () {
						this.close();
					}.bind(this)
				}));

				//call super
				Dialog.prototype.init.apply(this, arguments);
			},

			renderer: {
				//render : function(oRm, oControl) {
				//	//call super
				//	DialogRenderer.render(oRm, oControl);
				//}
			},

			/**
			 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			 * (NOT before the first rendering! onInit() is used for that one!).
			 * @memberOf control.F4ValueHelp.F4ValueHelp
			 */
			onBeforeRendering: function () {
				if (!this.getServiceModel()) {
					// console.error("Uncaught ReferenceError: serviceModel is not defined");
					jQuery.sap.log.error("Uncaught ReferenceError: serviceModel is not defined");
					return;
				}

				//we need to catch an error here to remove the static ID's from the tab Container an his Input Childs
				try {

					//create the navContainer to switch between Formular Page(tabPage) and Result Page(tablePage)
					var navContainer = new NavContainer();
					this.removeStyleClass("sapUiPopupWithPadding");

					var tabPage = new Page({
						showHeader: false,
						showSubHeader: false,
						showFooter: false
					});
					this._createTabBar();
					tabPage.addContent(this._tabContainer);

					this._tablePage = new Page({
						showSubHeader: false,
						showFooter: false
					});

					this._tablePageTable = new Table({
						mode: ListMode.SingleSelectMaster,
						select: this.onTableSelect.bind(this),
						growing: true,
						growingScrollToLoad: true
					});
					this._tablePage.addContent(this._tablePageTable);

					navContainer.addPage(tabPage);
					navContainer.addPage(this._tablePage);
					navContainer.setInitialPage(tabPage.getId());

					this.addContent(navContainer);
					this._navContainer = navContainer;

					//call super
					Dialog.prototype.onBeforeRendering.apply(this, arguments);

				}
				catch (err) {
					//if an error appears remove the tabContainer and his child to avoid a duplicate ID error
					// console.error(err);
					jQuery.sap.log.error(err);
					if (this._tabContainer && this._tabContainer.getItems()) {
						this._tabContainer.destroyItems();
					}
				}

			},

			/**
			 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
			 * This hook is the same one that SAPUI5 controls get after being rendered.
			 * @memberOf control.F4ValueHelp.F4ValueHelp
			 */
			onAfterRendering: function () {
				//older Versions doesn't look good with it
				if (this.getServiceModel()) {
					this._tabContainer.$().removeClass("sapContrastPlus");
				}
				Dialog.prototype.onAfterRendering.apply(this, arguments);
			},

			_createTabBar: function () {
				var that = this;

				var oServiceMetadata = this.getServiceModel().getServiceMetadata();
				var oDataService = oServiceMetadata.dataServices.schema[0];

				this._tabContainer = new TabContainer();
				this._tabContainer.addStyleClass("sapUiResponsiveContentPadding");

				this.getModelPaths().forEach(function (path) {

					var entityType = oDataService.entityType.find(function (entity) {
						return entity.name === path;
					});
					var tabTitle = that._searchTitle(entityType, path);

					//create Tab and form foreach path 
					var tabContainerItem = new TabContainerItem({
						id: path,
						name: tabTitle
					});
					var form = new SimpleForm({
						layout: "ResponsiveGridLayout",
						editable: true,
						labelSpanL: 4,
						labelSpanM: 4,
						emptySpanL: 3,
						emptySpanM: 3,
						columnsL: 1,
						columnsM: 1
					});

					//create a helpModel for easy access
					that._helpModel[path] = entityType;
					that._helpModel[path].label = tabTitle;
					//get the properties for label and input fields
					entityType.property.forEach(function (entity) {
						var label = new Label({
							// text: "{/#" + path + "/" + entity.name + "/@sap:label}"
							text: "{/#" + path + "/" + entity.name + "/sap:label}"
						});
						form.addContent(label);
						var inpt = that._getInputForEntity(entity, path);
						form.addContent(inpt);
					});

					tabContainerItem.addContent(form);
					that._tabContainer.addItem(tabContainerItem);
				});

				//The tabs have an close button by default. We don't need this here. 
				that._tabContainer.getAggregation("_tabStrip").getItems().forEach(function (item) {
					item.getAggregation("_closeButton").setVisible(false);
				});
			},

			//helper function to search an alternate title. If we can't find one we take the path name
			_searchTitle: function (entityType, path) {
				var tabTitle;

				var extension = entityType.extensions.find(function (ext) {
					return ext.name === "label";
				});
				//first look for the extension (@sap:label). If not set look for the HeaderInfo Annotation.
				if (extension) {
					tabTitle = extension.value;
				}
				else {
					var annotations = this.getServiceModel().getServiceAnnotations();
					var namespace = this.getServiceModel().getServiceMetadata().dataServices.schema[0].namespace;
					var annoPath = annotations[namespace + "." + path];
					if (annoPath) {
						var headerInfo = annoPath["com.sap.vocabularies.UI.v1.HeaderInfo"];
						tabTitle = headerInfo ? headerInfo.TypeName.String : undefined;
					}
				}

				//Fallback no Extension and no Annotation
				if (!tabTitle) {
					tabTitle = path;
				}

				return tabTitle;
			},

			//helper function to find a compatible input for the given Edm Type
			_getInputForEntity: function (entity, path) {
				var inputId = this.getInputId(entity.name, path);
				var input;
				switch (entity.type.split("Edm.")[1]) {
				case "DateTime":
					input = new DatePicker({
						id: inputId,
						valueFormat: "yyyy-MM-dd",
						width: "10em"
					});
					break;
				case "Time":
					input = new TimePicker({
						id: inputId,
						valueFormat: "PTkk'H'mm'M'ss'S'",
						width: "10em"
					});
					break;
				case "Boolean":
					input = new HBox(inputId);
					input.addItem(new RadioButton({
						id: inputId + "-true",
						groupName: inputId + "-group",
						text: "Ja"
					}));
					input.addItem(new RadioButton({
						id: inputId + "-false",
						groupName: inputId + "-group",
						text: "Nein"
					}));
					input.addItem(new RadioButton({
						id: inputId + "-ignore",
						groupName: inputId + "-group",
						text: "Nicht berücksichtigen",
						selected: true
					}));
					break;
				default:
					var inputTypeNumber = ["Decimal", "Double", "Single", "Int16", "Int32", "Int64", "Byte", "SByte"];
					var isNumberField = inputTypeNumber.includes(entity.type.split("Edm.")[1]);
					input = new Input({
						id: inputId,
						maxLength: {
							parts: [{
								path: "/#" + path + "/" + entity.name + "/@maxLength"
							}],
							formatter: this.parseToInt.bind(this)
						},
						submit: this.navigate.bind(this),
						type: isNumberField ? InputType.Number : InputType.Text
					});
					break;
				}
				return input;
			},

			//formatter for Input Field maxLength String to Int
			parseToInt: function (val) {
				var ret = parseInt(val, 10);
				return ret ? ret : undefined;
			},

			//helper function creates the string for an input ID
			getInputId: function (entityName, path) {
				return entityName + "-" + path + "-ValueHelp-Input";
			},

			//navigate between Formular Page(tabPage) and Result Page(tablePage)
			navigate: function () {
				var navBtn = this.getButtons()[0];
				if (this._navContainer.getCurrentPage() === this._tablePage) {
					navBtn.setText("Suche starten");
					this._navContainer.backToTop();
				}
				else {
					this._prepareTable();
					navBtn.setText("Zurück");
					this._navContainer.to(this._tablePage);
				}
			},

			//binds the chosen search help to the table and bind the Columns before navigate
			_prepareTable: function () {
				var that = this;

				//remove all Columns so we can choose another search help
				this._tablePageTable.removeAllColumns();

				var path = this._tabContainer.getSelectedItem();
				var columnList = new ColumnListItem();
				this._tablePage.setTitle(this._helpModel[path].label);

				//get all propertys and create columns
				this._helpModel[path].property.forEach(function (property, i) {
					var popin = (i > 1);
					var column = new Column({
						demandPopin: popin,
						minScreenWidth: popin ? "Small" : "",
						header: new Label({
							text: "{/#" + path + "/" + property.name + "/@sap:label}"
						})
					});
					that._tablePageTable.addColumn(column);

					var textType = that.getTypeForDateOrTime(property);

					columnList.addCell(new Label({
						text: {
							path: property.name,
							type: textType
						}
					}));
				});

				//add the keys to the column list to get them on selection
				columnList.data("key", this._helpModel[path].key.propertyRef);

				//bind the itemSet and create Filters from Inputs
				this._tablePageTable.bindItems({
					path: "/" + path + "Set",
					template: columnList,
					filters: this._getValueHelpFilters(),
					sorter: new Sorter(this._helpModel[path].property[0].name)
				});
			},

			getTypeForDateOrTime: function (property) {
				var type;
				if (property.type === "Edm.Time") {
					type = new sap.ui.model.odata.type.Time();

				}
				else if (property.type === "Edm.DateTime") {
					type = new sap.ui.model.type.Date({
						pattern: "yyyy-MM-dd HH:mm:ss",
						UTC: true
					});
				}
				return type;
			},

			_getValueHelpFilters: function () {
				var that = this;
				var entityModel = this._helpModel[this._tabContainer.getSelectedItem()];
				var filters = [];

				//creates foreach property a filter with the input value
				entityModel.property.forEach(function (item) {
					var input = sap.ui.getCore().byId(that.getInputId(item.name, entityModel.name));
					if (input.getValue ? input.getValue() : input instanceof HBox) {
						var filter = that._getFilterOperatorAndValue(input);
						if (filter.filterOp) {
							filters.push(new Filter({
								path: item.name,
								operator: filter.filterOp,
								value1: filter.value1,
								value2: filter.value2
							}));
						}
					}

				});

				return filters;
			},

			//helper function to get a compatible filter operator and the value(s) for EdmTypes
			_getFilterOperatorAndValue: function (input) {
				var filter = {};
				if (input instanceof Input) {
					filter.filterOp = (input.getType() === InputType.Text) ? FilterOperator.Contains : FilterOperator.EQ;
					filter.value1 = input.getValue();
				}
				else if (input instanceof DatePicker) {
					filter.filterOp = FilterOperator.BT;
					filter.value1 = input.getValue();
					filter.value2 = this.endOfDay(input.getDateValue());
				}
				else if (input instanceof HBox) {
					var radioBtns = input.getItems();
					if (!radioBtns[2].getSelected()) {
						filter.filterOp = FilterOperator.EQ;
						if (radioBtns[0].getSelected()) {
							filter.value1 = true;
						}
						else {
							filter.value1 = false;
						}
					}
				}
				else {
					filter.filterOp = FilterOperator.EQ;
					filter.value1 = input.getValue ? input.getValue() : input.getSelected();
				}
				return filter;
			},

			//this function removes the timezone and set the time to the end of the day for between filter
			endOfDay: function (date) {
				var dateOffset = date.getTimezoneOffset() * 60000;
				date.setTime(date.getTime() - dateOffset);
				date.setDate(date.getDate() + 1);
				date.setMilliseconds(date.getMilliseconds() - 1);
				return date;
			},

			//select function on Table. Saves the selected keys in _selectedKeys 
			onTableSelect: function (oEvent) {
				var path = this._tabContainer.getSelectedItem();
				var selectedItem = oEvent.getParameters().listItem;

				var selectedKeys = {};

				//search the keys on the selected item
				this._helpModel[path].key.propertyRef.forEach(function (key) {

					var keyCell = selectedItem.getCells().find(function (cell) {
						return cell.getBindingPath("text") === key.name;
					});
					selectedKeys[key.name] = keyCell.getText();

				});
				this._selectedKeys = selectedKeys;
				this.close();
			},

			//function to get the Table from outside
			getTable: function () {
				return this._tablePageTable;
			},

			//function to get the selected Keys from outside
			getSelectedKeys: function () {
				return this._selectedKeys;
			},

			//Destroys the Dialog. Without it we can't open the Dialog twice
			afterClose: function () {
				this.destroy();
			}

		});

	});