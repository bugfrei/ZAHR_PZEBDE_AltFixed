/*global QUnit*/

sap.ui.define([
	"ZAHR_PZEBDE/ZAHR_PZEBDE/controller/App.controller"
], function (Controller) {
	"use strict";

	QUnit.module("App Controller");

	QUnit.test("I should test the App controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});