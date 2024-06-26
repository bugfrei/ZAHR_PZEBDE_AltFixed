sap.ui.define(
  [
    "sap/m/library",
    "sap/ui/core/Control",
    "sap/ui/core/EnabledPropagator",
    "sap/ui/core/IconPool",
    "sap/ui/Device",
    "sap/ui/core/ContextMenuSupport",
    "sap/ui/core/library",
    "sap/m/ButtonRenderer",
    "sap/ui/events/KeyCodes",
    "sap/ui/core/LabelEnablement",
  ],
  function (t, e, i, s, n, o, a, r, c, h) {
    "use strict";
    var p = a.TextDirection;
    var u = t.ButtonType;
    var g = e.extend("sap.m.Button", {
      metadata: {
        interfaces: ["sap.ui.core.IFormContent"],
        library: "sap.m",
        properties: {
          text: { type: "string", group: "Misc", defaultValue: "" },
          type: {
            type: "sap.m.ButtonType",
            group: "Appearance",
            defaultValue: u.Default,
          },
          width: {
            type: "sap.ui.core.CSSSize",
            group: "Misc",
            defaultValue: null,
          },
          height: {
            type: "sap.ui.core.CSSSize",
            group: "Misc",
            defaultValue: null,
          },
          enabled: { type: "boolean", group: "Behavior", defaultValue: true },
          icon: {
            type: "sap.ui.core.URI",
            group: "Appearance",
            defaultValue: "",
          },
          iconFirst: {
            type: "boolean",
            group: "Appearance",
            defaultValue: true,
          },
          activeIcon: {
            type: "sap.ui.core.URI",
            group: "Misc",
            defaultValue: null,
          },
          iconDensityAware: {
            type: "boolean",
            group: "Misc",
            defaultValue: true,
          },
          textDirection: {
            type: "sap.ui.core.TextDirection",
            group: "Appearance",
            defaultValue: p.Inherit,
          },
        },
        associations: {
          ariaDescribedBy: {
            type: "sap.ui.core.Control",
            multiple: true,
            singularName: "ariaDescribedBy",
          },
          ariaLabelledBy: {
            type: "sap.ui.core.Control",
            multiple: true,
            singularName: "ariaLabelledBy",
          },
        },
        events: { tap: { deprecated: true }, press: {} },
        designtime: "sap/m/designtime/Button.designtime",
        dnd: { draggable: true, droppable: false },
      },
    });
    i.call(g.prototype);
    o.apply(g.prototype);
    g.prototype.init = function () {
      this._onmouseenter = this._onmouseenter.bind(this);
      this._buttonPressed = false;
    };
    g.prototype.exit = function () {
      if (this._image) {
        this._image.destroy();
      }
      if (this._iconBtn) {
        this._iconBtn.destroy();
      }
      this.$().off("mouseenter", this._onmouseenter);
    };
    g.prototype.setType = function (t) {
      this.setProperty("type", t, false);
      if (t === u.Critical && !this.getIcon()) {
        this.setIcon("sap-icon://message-error");
      } else if (t === u.Negative && !this.getIcon()) {
        this.setIcon("sap-icon://message-warning");
      } else if (t === u.Success && !this.getIcon()) {
        this.setIcon("sap-icon://message-success");
      } else if (t === u.Neutral && !this.getIcon()) {
        this.setIcon("sap-icon://message-information");
      }
      return this;
    };
    g.prototype.onBeforeRendering = function () {
      this._bRenderActive = this._bActive;
      this.$().off("mouseenter", this._onmouseenter);
    };
    g.prototype.onAfterRendering = function () {
      if (this._bRenderActive) {
        this._activeButton();
        this._bRenderActive = this._bActive;
      }
      this.$().on("mouseenter", this._onmouseenter);
    };
    g.prototype.ontouchstart = function (t) {
      t.setMarked();
      if (this._bRenderActive) {
        delete this._bRenderActive;
      }
      if (t.targetTouches.length === 1) {
        this._buttonPressed = true;
        this._activeButton();
      }
      if (this.getEnabled() && this.getVisible()) {
        if (
          n.browser.safari &&
          t.originalEvent &&
          t.originalEvent.type === "mousedown"
        ) {
          this.focus();
          t.preventDefault();
        }
        if (!sap.ui.Device.browser.msie) {
          this._sStartingTagId = t.target.id.replace(this.getId(), "");
        }
      } else {
        if (!sap.ui.Device.browser.msie) {
          this._sStartingTagId = "";
        }
      }
    };
    g.prototype.ontouchend = function (t) {
      this._buttonPressed = t.originalEvent && t.originalEvent.buttons & 1;
      this._inactiveButton();
      if (this._bRenderActive) {
        delete this._bRenderActive;
        if (
          t.originalEvent &&
          t.originalEvent.type in { mouseup: 1, touchend: 1 }
        ) {
          this.ontap(t);
        }
      }
      if (!sap.ui.Device.browser.msie) {
        this._sEndingTagId = t.target.id.replace(this.getId(), "");
        if (
          this._buttonPressed === 0 &&
          ((this._sStartingTagId === "-BDI-content" &&
            (this._sEndingTagId === "-content" ||
              this._sEndingTagId === "-inner" ||
              this._sEndingTagId === "-img")) ||
            (this._sStartingTagId === "-content" &&
              (this._sEndingTagId === "-inner" ||
                this._sEndingTagId === "-img")) ||
            (this._sStartingTagId === "-img" && this._sEndingTagId !== "-img"))
        ) {
          this.ontap(t);
        }
      }
    };
    g.prototype.ontouchcancel = function () {
      this._buttonPressed = false;
      this._inactiveButton();
    };
    g.prototype.ontap = function (t) {
      t.setMarked();
      if (this.getEnabled() && this.getVisible()) {
        if (t.originalEvent && t.originalEvent.type === "touchend") {
          this.focus();
        }
        this.fireTap({});
        this.firePress({});
      }
    };
    g.prototype.onkeydown = function (t) {
      if (
        t.which === c.SPACE ||
        t.which === c.ENTER ||
        t.which === c.ESCAPE ||
        t.which === c.SHIFT
      ) {
        if (t.which === c.SPACE || t.which === c.ENTER) {
          t.setMarked();
          this._activeButton();
        }
        if (t.which === c.ENTER) {
          this.firePress({});
        }
        if (t.which === c.SPACE) {
          this._bPressedSpace = true;
        }
        if (this._bPressedSpace) {
          if (t.which === c.SHIFT || t.which === c.ESCAPE) {
            this._bPressedEscapeOrShift = true;
            this._inactiveButton();
          }
        }
      } else {
        if (this._bPressedSpace) {
          t.preventDefault();
        }
      }
    };
    g.prototype.onkeyup = function (t) {
      if (t.which === c.ENTER) {
        t.setMarked();
        this._inactiveButton();
      }
      if (t.which === c.SPACE) {
        if (!this._bPressedEscapeOrShift) {
          t.setMarked();
          this._inactiveButton();
          this.firePress({});
        } else {
          this._bPressedEscapeOrShift = false;
        }
        this._bPressedSpace = false;
      }
      if (t.which === c.ESCAPE) {
        this._bPressedSpace = false;
      }
    };
    g.prototype._onmouseenter = function (t) {
      if (
        this._buttonPressed &&
        t.originalEvent &&
        t.originalEvent.buttons & 1
      ) {
        this._activeButton();
      }
    };
    g.prototype.onfocusout = function () {
      this._inactiveButton();
    };
    g.prototype._activeButton = function () {
      if (!this._isUnstyled()) {
        this.$("inner").addClass("sapMBtnActive");
      }
      this._bActive = this.getEnabled();
      if (this._bActive) {
        if (this.getIcon() && this.getActiveIcon() && this._image) {
          this._image.setSrc(this.getActiveIcon());
        }
      }
    };
    g.prototype._inactiveButton = function () {
      if (!this._isUnstyled()) {
        this.$("inner").removeClass("sapMBtnActive");
      }
      this._bActive = false;
      if (this.getEnabled()) {
        if (this.getIcon() && this.getActiveIcon() && this._image) {
          this._image.setSrc(this.getIcon());
        }
      }
    };
    g.prototype._isHoverable = function () {
      return this.getEnabled() && n.system.desktop;
    };
    g.prototype._getImage = function (t, e, i, n) {
      var o = s.isIconURI(e),
        a;
      if (
        (this._image instanceof sap.m.Image && o) ||
        (this._image instanceof sap.ui.core.Icon && !o)
      ) {
        this._image.destroy();
        this._image = undefined;
      }
      a = this.getIconFirst();
      if (this._image) {
        this._image.setSrc(e);
        if (this._image instanceof sap.m.Image) {
          this._image.setActiveSrc(i);
          this._image.setDensityAware(n);
        }
      } else {
        this._image = s
          .createControlByURI(
            {
              id: t,
              src: e,
              activeSrc: i,
              densityAware: n,
              useIconTooltip: false,
            },
            sap.m.Image
          )
          .addStyleClass("sapMBtnCustomIcon")
          .setParent(this, null, true);
      }
      this._image.addStyleClass("sapMBtnIcon");
      this._image.toggleStyleClass("sapMBtnIconLeft", a);
      this._image.toggleStyleClass("sapMBtnIconRight", !a);
      return this._image;
    };
    g.prototype._getInternalIconBtn = function (t, e) {
      var i = this._iconBtn;
      if (i) {
        i.setSrc(e);
      } else {
        i = s
          .createControlByURI(
            { id: t, src: e, useIconTooltip: false },
            sap.m.Image
          )
          .setParent(this, null, true);
      }
      i.addStyleClass("sapMBtnIcon");
      i.addStyleClass("sapMBtnIconLeft");
      this._iconBtn = i;
      return this._iconBtn;
    };
    g.prototype._isUnstyled = function () {
      var t = false;
      if (this.getType() === u.Unstyled) {
        t = true;
      }
      return t;
    };
    g.prototype.getPopupAnchorDomRef = function () {
      return this.getDomRef("inner");
    };
    g.prototype._getText = function () {
      return this.getText();
    };
    g.prototype._getTooltip = function () {
      var t = this.getTooltip_AsString();
      if (!t && !this.getText()) {
        var e = s.getIconInfo(this.getIcon());
        if (e && e.text) {
          t = e.text;
        }
      }
      return t;
    };
    g.prototype.getAccessibilityInfo = function () {
      var t = this.getText() || this.getTooltip_AsString();
      if (!t && this.getIcon()) {
        var e = s.getIconInfo(this.getIcon());
        if (e) {
          t = e.text || e.name;
        }
      }
      return {
        role: "button",
        type: sap.ui
          .getCore()
          .getLibraryResourceBundle("sap.m")
          .getText("ACC_CTR_TYPE_BUTTON"),
        description: t,
        focusable: this.getEnabled(),
        enabled: this.getEnabled(),
      };
    };
    g.prototype._determineSelfReferencePresence = function () {
      var t = this.getAriaLabelledBy(),
        e = t.indexOf(this.getId()) !== -1,
        i = h.getReferencingLabels(this).length > 0,
        s = this.getParent(),
        n = !!(s && s.enhanceAccessibilityState);
      return !e && this._getText() && (t.length > 0 || i || n);
    };
    return g;
  }
);
