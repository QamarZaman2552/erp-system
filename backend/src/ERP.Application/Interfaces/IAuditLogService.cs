using ERP.Application.Common;
using ERP.Application.DTOs.Business;

namespace ERP.Application.Interfaces;

public interface IAuditLogService
{
    Task WriteAsync(string userId, string userName, string action, string entityType,
        string? entityId = null, string? newValues = null, string? ipAddress = null, string? userAgent = null);
    Task<PagedResult<AuditLogDto>> GetLogsAsync(PaginationParams pagination,
        string? userId = null, string? module = null, DateTime? from = null, DateTime? to = null);
    Task<string> ExportCsvAsync(string? userId = null, string? module = null, DateTime? from = null, DateTime? to = null);
}
