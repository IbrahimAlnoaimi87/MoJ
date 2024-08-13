if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
if (typeof SourceCode.Forms.Help === "undefined" || SourceCode.Forms.Help === null) SourceCode.Forms.Help = {};

SourceCode.Forms.Help.HelpHelper = function ()
{
}

SourceCode.Forms.Help.HelpHelper.prototype = {
	//runHelp
	runHelp: function (helpID, controlType)
	{
		if (controlType !== null && controlType !== undefined)
		{
			switch (controlType)
			{
				case 'ListDisplay': helpID = 7033;
					break;
				case 'Lookup': helpID = 7032;
					break;
				case 'DropDown': helpID = 7031;
					break;
				case 'AssociationHeading': helpID = 7034;
					break;
				case 'RadioButtonList': helpID = 7045;
					break;
				case 'Choice': helpID = 5004;
					break;
				case 'MultiSelect': helpID = 5005;
					break;
				case 'AutoComplete': helpID = 5008;
					break;
			}
		}
		window.open(applicationRoot + "Help.aspx?ID=" + helpID.toString());
	}
}
var HelpHelper = new SourceCode.Forms.Help.HelpHelper();
