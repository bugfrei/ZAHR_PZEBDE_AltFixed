function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZAHR_PZEBDE_GET_FA_PSP_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}