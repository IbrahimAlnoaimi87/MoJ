(function ($)
{
	$.fn.visibleUntil = function (targetSelector)
	{
		var selectedItems = $();

		for (var i = 0; i < this.length; i++)
		{
			var firstItemFound = $(this[i]).closest(".hidden, [style*='display:none'], [style*='display: none'], " + targetSelector);

			if (firstItemFound.is(targetSelector))
			{
				selectedItems.push(this[i]);
			}
		}

		return selectedItems;
	}

}(jQuery))