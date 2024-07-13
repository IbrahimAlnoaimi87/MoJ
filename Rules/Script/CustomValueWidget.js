var categoryTree;

//var rulesWizardContextMenu = new RulesWizardContextMenu();

//Constructor
//#region
function CustomValueWidget()
{
    //this.targetID = "Morne se targetID";
}
//#endregion

CustomValueWidget.prototype =
{
    openPopupWindow: function ()
    {
        var _this = this;
        if (_this.forcedClick === false)
        {
            var popupHeading = "* Type a custom value";
            var containerElemClass;
            if (this.PopupHeading) popupHeading = this.PopupHeading;

            containerElement = jQuery("<div></div>");

            containerElemClass = this.MultipleRows ? 'custom-value-widget-textarea' : 'custom-value-widget-textbox';
            containerElement.addClass(containerElemClass);
            var checkboxLineHeight = 0;
            if (this.ShowCheckbox)
            {
                checkboxLineHeight = 25;
            }
            popupManager.showPopup({
                id:"rwCustomValuePopup",
                buttons: [
                {
                    type: "help",
                    click: function () { HelpHelper.runHelp(7019); }
                },
                {
                    text: Resources.WizardButtons.OKButtonText,
                    click: function () { with (_this) { _this.popupOkClick() } }
                },
                {
                    text: Resources.WizardButtons.CancelButtonText,
                    click: function () { popupManager.closeLast(); }
                }],
                headerText: popupHeading,
                content: containerElement,
                modalize: true,
                width: 600,
                height: (this.MultipleRows) ? 191 + checkboxLineHeight : 144 + checkboxLineHeight 
            });

            var labelText = "* Value:";
            if (this.LabelText) labelText = this.LabelText;

            var panel = jQuery(SCPanel.html()).panel();
            var panelBody = panel.panel("fetch", "body");
            containerElement.append(panel);
            var labelTextBox = jQuery(SCFormField.html({ label: labelText, required: true })); //TODO must be specified by rules wizard
            panelBody.append(labelTextBox);

            var value = "";
            var valueXml = "";
            if (this.value) value = this.value;
            this.textBox = null;

            if (this.ShowCheckbox && value !== "")
            {
                valueXml = parseXML(value);
                value = valueXml.selectSingleNode("/Message/Value").text;
            }

            if (this.MultipleRows)
            {
                this.textBox = jQuery(SCTextbox.html({ value: value, required: true, rows: 4 }));
            } 
            else
            {
                this.textBox = jQuery(SCTextbox.html({ value: value, required: true }));
            }

            labelTextBox.find(".form-field-element-wrapper").append(this.textBox);
            var _this = this;
            this.textBox.textbox();

            if (this.ShowCheckbox)
            {
                var checkboxText = "Literal:";
                if (this.CheckboxText) checkboxText = this.CheckboxText;
                var labelLiteral = jQuery(SCFormField.html({ label: checkboxText, required: true }));
                panelBody.append(labelLiteral);

                var checkboxChecked = false;
                if (valueXml !== "")
                {
                    checkboxValue = valueXml.selectSingleNode("/Message/Checked").text;
                    if (checkboxValue.toLowerCase() === "true")
                    {
                        checkboxChecked = true;
                    }
                }
                this.checkbox = $(SCCheckbox.html({ checked: checkboxChecked})).appendTo(labelLiteral).checkbox();
            }

            setTimeout(function () { with (_this) { _this.setTextBoxFocus() } }, 200);
        }
    },

    setTextBoxFocus: function ()
    {
        if (this.MultipleRows)
        {
            this.textBox.find("textarea")[0].focus();
        }
        else
        {
            this.textBox.find("input")[0].focus();
        }
    },

    popupOkClick: function ()
    {
        var result = "";
        if (this.MultipleRows)
        {
            result = this.textBox.find("textarea").val();
        }
        else
        {
            result = this.textBox.find("input").val();
        }

        if (result !== "")
        {
            this.display = result;
            this.value = result;
            if (this.ShowCheckbox)
            {
                this.CheckboxChecked = this.checkbox.hasClass("checked");
                var xml = "<Message><Value>" + this.value.xmlEncode() + "</Value><Checked>" + this.CheckboxChecked + "</Checked></Message>";
                this.value = xml;
            }

            SourceCode.Forms.Designers.Rule.onWidgetCompleted(this);
            popupManager.closeLast();
        }
        else
        {
            var warningMessage = "* The value is required";
            if (this.WarningMessage) warningMessage = this.WarningMessage;
            popupManager.showWarning(warningMessage);
        }
    }
}

