using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ERP.IntegrationTests;

[Collection("api")]
public class ValidationEndpointTests(ErpApiFactory factory)
{
    private async Task<HttpClient> GetAuthorizedClientAsync() =>
        await factory.LoginAndAuthorizeAsync("admin@company.com", ErpApiFactory.DefaultAdminPassword);

    [Fact]
    public async Task InvalidLoginPayload_MissingFields_Returns400WithErrors()
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email = "", password = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.GetProperty("errors").EnumerateObject().Any());
    }

    [Fact]
    public async Task CreateEmployee_InvalidPayload_Returns400WithFieldErrors()
    {
        var client = await GetAuthorizedClientAsync();

        var invalid = new
        {
            firstName = "",                       // required
            lastName = "Doe",
            email = "not-an-email",               // bad format
            phone = "abc",                        // bad format
            dateOfBirth = "1890-01-01T00:00:00Z", // too old
            dateOfJoining = DateTime.UtcNow.AddYears(-1),
            gender = 0,
            basicSalary = -5,                     // must be > 0
            departmentId = Guid.NewGuid(),
            designationId = Guid.NewGuid()
        };

        var response = await client.PostAsJsonAsync("/api/employees", invalid);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var errors = json.GetProperty("errors");
        Assert.True(errors.TryGetProperty("firstName", out _));
        Assert.True(errors.TryGetProperty("email", out _));
        Assert.True(errors.TryGetProperty("basicSalary", out _));
    }

    [Fact]
    public async Task CreateEmployee_FutureJoiningDate_Returns400()
    {
        var client = await GetAuthorizedClientAsync();

        var invalid = new
        {
            firstName = "John",
            lastName = "Doe",
            email = $"{Guid.NewGuid():N}@corp.com",
            dateOfBirth = "1995-05-10T00:00:00Z",
            dateOfJoining = DateTime.UtcNow.AddYears(2), // too far in future
            gender = 0,
            basicSalary = 50000,
            departmentId = Guid.NewGuid(),
            designationId = Guid.NewGuid()
        };

        var response = await client.PostAsJsonAsync("/api/employees", invalid);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateLeave_EndBeforeStart_Returns400()
    {
        var client = await GetAuthorizedClientAsync();

        var invalid = new
        {
            employeeId = Guid.NewGuid(),
            leaveType = 1,
            startDate = "2026-09-10",
            endDate = "2026-09-01",
            reason = "test"
        };

        var response = await client.PostAsJsonAsync("/api/leaves", invalid);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GeneratePayroll_Month13_Returns400()
    {
        var client = await GetAuthorizedClientAsync();

        var response = await client.PostAsJsonAsync("/api/payroll/generate", new { month = 13, year = 2026 });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
