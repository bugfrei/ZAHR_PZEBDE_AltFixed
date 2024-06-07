/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ZAHR_PZEBDE/ZAHR_PZEBDE/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});