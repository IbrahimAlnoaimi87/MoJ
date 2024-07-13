using System.Web;

namespace SourceCode.Forms.Runtime
{
	/// <summary>
	/// Summary description for UserResources
	/// </summary>
	public class AnonymousResources : BaseResourcesHandler
	{
		protected override string ProcessAdditionalMethods(string method, HttpContext context, HandlerCacheEntry entry)
		{
			// Initialize content variable
			string content = null;

			// Check additional methods 
			switch (method.ToUpperInvariant())
			{
				default:
					base.ProcessAdditionalMethods(method, context, entry);
					break;
			}

			// Return the build results
			return content;
		}
	}
}
