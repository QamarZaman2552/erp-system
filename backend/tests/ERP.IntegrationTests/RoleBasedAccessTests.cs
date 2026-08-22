using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ERP.IntegrationTests;

[Collection("api")]
public class RoleBasedAccessTests(ErpApiFactory factory)
{
    private static readonly string HrEmail = $"hr-user-{Guid.NewGuid():N}@test.com";
    private const string HrPassword = "Test@1234";

    private static readonly string EmployeeEmail = $"emp-user-{Guid.NewGuid():N}@test.com";
    private const string EmployeePassword = "Test@1234";

    [Fact]
    public async Task HrRole_CannotDeleteDepartment_AdminOnly()
    {
        await factory.CreateUserAsync(HrEmail, HrPassword, "HR");
        var client = await factory.LoginAndAuthorizeAsync(HrEmail, HrPassword);

        // Find any department (endpoint returns a bare array)
        var listResponse = await client.GetAsync("/api/departments");
        listResponse.EnsureSuccessStatusCode();
        var departments = await listResponse.Content.ReadFromJsonAsync<JsonElement>();
        var deptId = departments[0].GetProperty("id").GetString();

        var deleteResponse = await client.DeleteAsync($"/api/departments/{deptId}");
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task AdminRole_CanDeleteDepartment()
    {
        var client = await factory.LoginAndAuthorizeAsync("admin@company.com", ErpApiFactory.DefaultAdminPassword);

        // Create a disposable department first
        var create = await client.PostAsJsonAsync("/api/departments", new { name = $"Temp-{Guid.NewGuid():N}"[..20] });
        create.EnsureSuccessStatusCode();
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("data").GetProperty("id").GetString();

        var delete = await client.DeleteAsync($"/api/departments/{id}");
        Assert.True(delete.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent,
            $"Expected success, got {delete.StatusCode}");
    }

    [Fact]
    public async Task PlainEmployee_CannotCreateEmployee_HrOrAdminOnly()
    {
        await factory.CreateUserAsync(EmployeeEmail, EmployeePassword, "Employee");
        var client = await factory.LoginAndAuthorizeAsync(EmployeeEmail, EmployeePassword);

        var payload = new
        {
            firstName = "X",
            lastName = "Y",
            email = $"{Guid.NewGuid():N}@corp.com",
            dateOfBirth = "1995-05-10T00:00:00Z",
            dateOfJoining = "2024-01-01T00:00:00Z",
            gender = 0,
            basicSalary = 50000,
            departmentId = Guid.NewGuid(),
            designationId = Guid.NewGuid()
        };

        var response = await client.PostAsJsonAsync("/api/employees", payload);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
