using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ERP.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private static readonly string[] AllowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".docx" };
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(AppDbContext db, IWebHostEnvironment env, ILogger<DocumentService> logger)
    {
        _db = db;
        _env = env;
        _logger = logger;
    }

    private string UploadRoot => Path.Combine(_env.ContentRootPath, "uploads");

    public async Task<ApiResponse<DocumentDto>> UploadAsync(Stream fileStream, string fileName, long fileSize,
        string? entityType, string? entityId, DateTime? expiryDate, string uploadedByUserId)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return ApiResponse<DocumentDto>.Fail($"File type '{ext}' not allowed. Allowed: PDF, JPG, PNG, DOCX");
        if (fileSize > MaxFileSizeBytes)
            return ApiResponse<DocumentDto>.Fail("File exceeds 5MB limit");
        if (string.IsNullOrWhiteSpace(entityType) || string.IsNullOrWhiteSpace(entityId))
            return ApiResponse<DocumentDto>.Fail("entityType and entityId are required");

        try
        {
            var folder = Path.Combine(UploadRoot, entityType.ToLowerInvariant());
            Directory.CreateDirectory(folder);
            var storedName = $"{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(folder, storedName);

            await using (var target = File.Create(fullPath))
                await fileStream.CopyToAsync(target);

            var doc = new Document
            {
                Name = Path.GetFileNameWithoutExtension(fileName),
                FileUrl = $"uploads/{entityType.ToLowerInvariant()}/{storedName}",
                FileType = ext.TrimStart('.').ToUpperInvariant(),
                FileSizeBytes = fileSize,
                EntityType = entityType,
                EntityId = entityId,
                ExpiryDate = expiryDate,
                UploadedByUserId = uploadedByUserId
            };
            _db.Documents.Add(doc);
            await _db.SaveChangesAsync();

            return MapOk(doc, "Document uploaded");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Document upload failed");
            return ApiResponse<DocumentDto>.Fail("File storage error");
        }
    }

    public async Task<List<DocumentDto>> GetForEntityAsync(string entityType, string entityId)
    {
        var docs = await _db.Documents.AsNoTracking()
            .Where(d => d.EntityType == entityType && d.EntityId == entityId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
        return docs.Select(Map).ToList();
    }

    public async Task<PagedResult<DocumentDto>> SearchAsync(PaginationParams pagination, string? searchTerm, string? entityType, string? uploadedByUserId)
    {
        var query = _db.Documents.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var s = $"%{searchTerm}%";
            query = query.Where(d => EF.Functions.Like(d.Name, s));
        }
        if (!string.IsNullOrWhiteSpace(entityType))
            query = query.Where(d => d.EntityType == entityType);
        if (!string.IsNullOrWhiteSpace(uploadedByUserId))
            query = query.Where(d => d.UploadedByUserId == uploadedByUserId);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(d => d.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync();

        return new PagedResult<DocumentDto>
        {
            Items = items.Select(Map).ToList(),
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<(byte[] Content, string FileType, string Name)?> DownloadAsync(Guid id)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc == null || !File.Exists(Path.Combine(_env.ContentRootPath, doc.FileUrl))) return null;

        var content = await File.ReadAllBytesAsync(Path.Combine(_env.ContentRootPath, doc.FileUrl));
        var contentType = doc.FileType.ToUpperInvariant() switch
        {
            "PDF" => "application/pdf",
            "PNG" => "image/png",
            "JPG" or "JPEG" => "image/jpeg",
            "DOCX" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };
        return (content, contentType, $"{doc.Name}.{doc.FileType.ToLowerInvariant()}");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id, string currentUserId, bool isAdmin)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc == null) return ApiResponse<string>.Fail("Document not found");
        if (!isAdmin && doc.UploadedByUserId != currentUserId)
            return ApiResponse<string>.Fail("Only the uploader or an Admin can delete this document");

        var path = Path.Combine(_env.ContentRootPath, doc.FileUrl);
        if (File.Exists(path)) File.Delete(path);

        _db.Documents.Remove(doc); // hard delete for files
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Document deleted");
    }

    public async Task<List<DocumentDto>> GetExpiringAsync(int withinDays = 30)
    {
        var cutoff = DateTime.UtcNow.Date.AddDays(withinDays);
        var docs = await _db.Documents.AsNoTracking()
            .Where(d => d.ExpiryDate != null && d.ExpiryDate.Value.Date <= cutoff && d.ExpiryDate.Value.Date >= DateTime.UtcNow.Date.AddDays(-365))
            .OrderBy(d => d.ExpiryDate)
            .ToListAsync();
        return docs.Select(Map).ToList();
    }

    private DocumentDto Map(Document d) => new(
        d.Id, d.Name, d.FileType, d.FileSizeBytes, d.EntityType, d.EntityId,
        d.ExpiryDate, d.UploadedByUserId, d.CreatedAt);

    private ApiResponse<DocumentDto> MapOk(Document d, string msg) => ApiResponse<DocumentDto>.Ok(Map(d), msg);
}
