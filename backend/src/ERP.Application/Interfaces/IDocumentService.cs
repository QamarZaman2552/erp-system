using ERP.Application.Common;
using ERP.Application.DTOs.Business;

namespace ERP.Application.Interfaces;

public interface IDocumentService
{
    Task<ApiResponse<DocumentDto>> UploadAsync(Stream fileStream, string fileName, long fileSize,
        string? entityType, string? entityId, DateTime? expiryDate, string uploadedByUserId);
    Task<List<DocumentDto>> GetForEntityAsync(string entityType, string entityId);
    Task<PagedResult<DocumentDto>> SearchAsync(PaginationParams pagination, string? searchTerm, string? entityType, string? uploadedByUserId);
    Task<(byte[] Content, string FileType, string Name)?> DownloadAsync(Guid id);
    Task<ApiResponse<string>> DeleteAsync(Guid id, string currentUserId, bool isAdmin);
    Task<List<DocumentDto>> GetExpiringAsync(int withinDays = 30);
}
