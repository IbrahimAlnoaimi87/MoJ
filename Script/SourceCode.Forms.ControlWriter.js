//ControlWriter
function ControlWriter() {
}

//prototype
ControlWriter.prototype = {
	//checkBox
	checkBox: function (options)
	{
		return jQuery(SCCheckbox.html(options)).checkbox();
	},

	//formField
	formField: function (options)
	{
		return jQuery(SCFormField.html(options));
	},

	//label
	label: function (value)
	{
		var _label = document.createElement('label');

		_label.innerHTML = value;
		_label.style.fontWeight = 700;

		return _label;
	},

	//lineBreak
	lineBreak: function (lineHeight)
	{
		var _div = document.createElement('div');

		_div.style.height = (lineHeight || 5) + 'px';

		return _div;
	},

	//lookupBox
	lookupBox: function (options)
	{
		return jQuery(SCLookupBox.html(options)).lookupbox();
	},

	//categoryLookup
	categoryLookup: function (options, changeFunction)
	{
		return jQuery(SCCategoryLookup.html(options)).categorylookup({ change: changeFunction });
	},

	//radioButtonGroup
	radioButtonGroup: function ()
	{
		return jQuery(SCRadiobuttonGroup.html({})).radiobuttongroup();
	},

	//textBox
	textBox: function (options)
	{
		return jQuery(SCTextbox.html(options));
	},

	//panel
	panel: function (options)
	{
		return jQuery(SCPanel.html(options));
	}
}