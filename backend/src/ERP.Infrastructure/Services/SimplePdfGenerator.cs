using System.Text;

namespace ERP.Infrastructure.Services;

/// <summary>
/// Minimal dependency-free PDF generator (single page, Helvetica, text lines).
/// Produces a valid PDF 1.4 document with correct xref offsets.
/// </summary>
public static class SimplePdfGenerator
{
    public static byte[] Generate(string title, IReadOnlyList<string> lines)
    {
        const double pageWidth = 612;   // US Letter
        const double pageHeight = 792;
        const double margin = 50;
        const double lineGap = 16;
        const int maxLines = (int)((pageHeight - 2 * margin) / lineGap);

        var content = new StringBuilder();
        content.Append("BT\n");

        // Title: bold-ish via larger size
        var y = pageHeight - margin;
        content.Append($"/F2 18 Tf {margin} {y.ToString("0")} Td ({Escape(title)}) Tj ET\nBT\n");
        y -= 28;
        content.Append($"/F1 11 Tf 0 0 Td ET\n");

        foreach (var raw in lines.Take(maxLines - 2))
        {
            y -= lineGap;
            if (y < margin) break;
            var line = raw ?? string.Empty;
            var fontSize = 11d;
            // Simple heading convention: lines starting with "##" are section headers
            if (line.StartsWith("##"))
            {
                fontSize = 13;
                line = line.Substring(2).Trim();
                y -= 6;
            }
            content.Append($"BT /F{(fontSize > 12 ? 2 : 1)} {fontSize.ToString("0")} Tf {margin} {y.ToString("0")} Td ({Escape(Truncate(line, 95))}) Tj ET\n");
        }

        var contentBytes = Encoding.GetEncoding("ISO-8859-1").GetBytes(content.ToString());

        using var ms = new MemoryStream();
        var sw = new StreamWriter(ms, new UTF8Encoding(false));
        var offsets = new List<int>();

        sw.Write("%PDF-1.4\n");
        offsets.Add((int)ms.Position);
        sw.Write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        offsets.Add((int)ms.Position);
        sw.Write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        offsets.Add((int)ms.Position);
        sw.Write($"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {pageWidth} {pageHeight}] /Resources << /Font << /F1 5 0 R /F2 4 0 R >> >> /Contents 6 0 R >>\nendobj\n");
        offsets.Add((int)ms.Position);
        sw.Write("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");
        offsets.Add((int)ms.Position);
        sw.Write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
        offsets.Add((int)ms.Position);
        sw.Write($"6 0 obj\n<< /Length {contentBytes.Length} >>\nstream\n");
        sw.Flush();
        ms.Write(contentBytes, 0, contentBytes.Length);
        offsets.Add((int)ms.Position);
        sw.Write("\nendstream\nendobj\n");

        var xrefPos = (int)ms.Position;
        sw.Write($"xref\n0 7\n0000000000 65535 f \n");
        foreach (var off in offsets)
            sw.Write($"{off:D10} 00000 n \n");
        sw.Write($"trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n{xrefPos}\n%%EOF");
        sw.Flush();

        return ms.ToArray();
    }

    private static string Escape(string s)
        => s.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");

    private static string Truncate(string s, int max)
        => s.Length <= max ? s : s[..max];
}
