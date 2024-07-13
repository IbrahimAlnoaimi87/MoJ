jQuery(document).ready(function ()
{
	if ($("#ErrorDetailsBarExpander") != null)
	{
		$("#ErrorDetails").hide();
	}

	if ($.trim($("#ErrorMsg").text()) != "")
	{
		$("#ExceptionDetail").show();
		$("#ExHead").show();
	}

	$("body").delegate("#CopyDetailButton", "click.errordetails", function ()
	{
		var textToCopy = $('#ErrorMsgCopy').text();
		
		if (window.clipboardData && clipboardData.setData)
		{
			window.clipboardData.setData("Text", textToCopy);
		}
		else
		{
			var popup = popupManager.showPopup(
			{
				buttons: [{ text: Resources.CommonActions.Close, click: function () { popupManager.closeLast(); } }],
				headerText: Resources.ExceptionHandler.CopyDetailsHeaderText,
				height: 299,
				message: SCPanel.html({ fullsize: true, content: Resources.ExceptionHandler.CopyDetailsInstructionsText + "<br/><br/>" + SCTextbox.html({ rows: 15, value: textToCopy }) }),
				width: 720
			});

			var textbox = popup.find("textarea").textbox();
			window.setTimeout(function ()
			{
				textbox[0].focus();
				textbox[0].select();
			}, 250);
		}
	});

	$("body").delegate("#ErrorDetailsBarExpander", "click.errordetails", function ()
	{
		$("#CopyDetailButton").show();

		if ($(this).is(".active") == false)
		{
			$(this).addClass("active");
			$("#ErrorDetails").show();
			$("#ExHead").show();
		}
		else
		{
			$(this).removeClass("active");
			$("#ErrorDetails").hide();
			$("#ExHead").hide();
		}
	});

});