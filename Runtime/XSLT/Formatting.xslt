<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt" exclude-result-prefixes="msxsl">

  <xsl:param name="value"></xsl:param>
  <xsl:param name="format"></xsl:param>
  <xsl:param name="type"></xsl:param>
  <xsl:template match="/">
		<xsl:element name="Result">
			<xsl:choose>
				<xsl:when test="$type='autonumber' or $type='decimal' or $type='number' or $type='Custom'">
					<xsl:value-of select='format-number($value, $format)'/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="$value"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:element>
  </xsl:template>
</xsl:stylesheet>
