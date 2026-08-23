using System.Text;
using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;
    public AuditLogService(AppDbContext db) => _db = db;

    public async Task WriteAsync(string userId, string userName, string action, string entityType,
        string? entityId = null, string? newValues = null, string? ipAddress = null, string? userAgent = null)
    {
        // Append-only: no update/delete paths exist for ActivityLogs (tamper-resistant by design)
        _db.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId ?? "System",
            UserName = userName ?? "System",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            NewValues = newValues != null && newValues.Length > 4000 ? newValues[..4000] : newValues,
            IpAddress = ipAddress,
            UserAgent = userAgent != null && userAgent.Length > 300 ? userAgent[..300] : userAgent,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<AuditLogDto>> GetLogsAsync(PaginationParams pagination,
        string? userId = null, string? module = null, DateTime? from = null, DateTime? to = null)
    {
        var query = _db.ActivityLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(l => l.UserId == userId || l.UserName.Contains(userId));
        if (!string.IsNullOrWhiteSpace(module))
            query = query.Where(l => l.EntityType == module || l.Action.Contains(module));
        if (from.HasValue) query = query.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue) query = query.Where(l => l.Timestamp <= to.Value);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(l => l.Timestamp)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(l => new AuditLogDto(l.Id, l.UserId, l.UserName, l.Action, l.EntityType,
                l.EntityId, l.NewValues, l.IpAddress, l.Timestamp))
            .ToListAsync();

        return new PagedResult<AuditLogDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<string> ExportCsvAsync(string? userId = null, string? module = null, DateTime? from = null, DateTime? to = null)
    {
        var query = _db.ActivityLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(userId))
            query = query.Where(l => l.UserId == userId || l.UserName.Contains(userId));
        if (!string.IsNullOrWhiteSpace(module))
            query = query.Where(l => l.EntityType == module || l.Action.Contains(module));
        if (from.HasValue) query = query.Where(l => l.Timestamp >= from.Value);
        if (to.HasValue) query = query.Where(l => l.Timestamp <= to.Value);

        var rows = await query.OrderBy(l => l.Timestamp)
            .Select(l => new { l.Timestamp, l.UserName, l.Action, l.EntityType, EntityId = l.EntityId ?? "", Ip = l.IpAddress ?? "" })
            .ToListAsync();

        var sb = new StringBuilder("Timestamp,User,Action,Module,EntityId,IpAddress\n");
        foreach (var r in rows)
            sb.Append($"{r.Timestamp:yyyy-MM-dd HH:mm:ss},{CsvEscape(r.UserName)},{r.Action},{CsvEscape(r.EntityType)},{CsvEscape(r.EntityId)},{r.Ip}\n");

        return sb.ToString();
    }

    private static string CsvEscape(string s) =>
        string.IsNullOrEmpty(s) ? "" : (s.Contains(',') || s.Contains('"') || s.Contains('\n') ? $"\"{s.Replace("\"", "\"\"")}\"" : s);
}
