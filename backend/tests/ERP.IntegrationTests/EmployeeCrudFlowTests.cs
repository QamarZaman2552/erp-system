using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ERP.IntegrationTests;

[Collection("api")]
public class EmployeeCrudFlowTests(ErpApiFactory factory)
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task FullLifecycle_CreateFetchUpdateDelete_Succeeds()
    {
        var client = await factory.LoginAndAuthorizeAsync("admin@company.com", ErpApiFactory.DefaultAdminPassword);

        // 1. Locate seeded department + designation (both endpoints return bare arrays)
        var depts = await (await client.GetAsync("/api/departments")).Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var engineering = depts.EnumerateArray()
            .First(d => d.GetProperty("name").GetString() == "Engineering");
        var deptId = engineering.GetProperty("id").GetString()!;

        var desigs = await (await client.GetAsync($"/api/designations/by-department/{deptId}"))
            .Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var desigId = desigs.EnumerateArray().First().GetProperty("id").GetString()!;

        // 2. Create employee
        var email = $"{Guid.NewGuid():N}@corp.com";
        var create = await client.PostAsJsonAsync("/api/employees", new
        {
            firstName = "Alice",
            lastName = "Wonders",
            email,
            phone = "+91-9876543210",
            dateOfBirth = "1996-03-15T00:00:00Z",
            dateOfJoining = DateTime.UtcNow.AddMonths(-6),
            gender = 1,
            city = "Pune",
            country = "India",
            basicSalary = 950000m,
            departmentId = deptId,
            designationId = desigId
        });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);

        var createdJson = await create.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        var employeeId = createdJson.GetProperty("data").GetProperty("id").GetString()!;
        Assert.StartsWith("EMP-", createdJson.GetProperty("data").GetProperty("employeeCode").GetString());

        // 3. Fetch by id
        var fetched = await client.GetAsync($"/api/employees/{employeeId}");
        fetched.EnsureSuccessStatusCode();
        var empJson = await fetched.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        Assert.Equal("Alice Wonders",
            empJson.GetProperty("data").GetProperty("fullName").GetString());
        Assert.Equal("Engineering", empJson.GetProperty("data").GetProperty("departmentName").GetString());

        // 4. Update salary via PUT
        var update = await client.PutAsJsonAsync($"/api/employees/{employeeId}", new
        {
            firstName = "Alice",
            lastName = "Wonders",
            phone = "+91-9876543210",
            dateOfBirth = "1996-03-15T00:00:00Z",
            gender = 1,
            city = "Mumbai",
            country = "India",
            basicSalary = 1100000m,
            departmentId = Guid.Parse(deptId),
            designationId = Guid.Parse(desigId),
            status = 0
        });
        update.EnsureSuccessStatusCode();
        var updatedJson = await update.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        Assert.Equal(1100000m, updatedJson.GetProperty("data").GetProperty("basicSalary").GetDecimal());

        // 5. Verify visible in paginated list (PagedResult is at root, not wrapped)
        var list = await client.GetAsync("/api/employees?page=1&pageSize=100");
        list.EnsureSuccessStatusCode();
        var listJson = await list.Content.ReadFromJsonAsync<JsonElement>(JsonOpts);
        Assert.Equal(100, listJson.GetProperty("pageSize").GetInt32());
        Assert.Contains(listJson.GetProperty("items").EnumerateArray(),
            e => e.GetProperty("id").GetString() == employeeId);

        // 6. Delete (Admin only)
        var delete = await client.DeleteAsync($"/api/employees/{employeeId}");
        Assert.True(delete.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent);

        // 7. Soft-deleted employee no longer fetchable
        var goneCheck = await client.GetAsync($"/api/employees/{employeeId}");
        Assert.Equal(HttpStatusCode.NotFound, goneCheck.StatusCode);
    }
}
