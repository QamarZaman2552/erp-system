using ERP.Domain.Entities;
using ERP.Domain.Enums;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ERP.Infrastructure.Data.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            if (db.Database.IsRelational())
                await db.Database.MigrateAsync();
            else
                await db.Database.EnsureCreatedAsync();

            // Seed roles
            string[] roles = ["Admin", "HR", "Manager", "Employee"];
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                    await roleManager.CreateAsync(new IdentityRole(role));
            }

            // Seed admin user
            const string adminEmail = "admin@company.com";
            var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
            if (existingAdmin == null)
            {
                var admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "System",
                    LastName = "Admin",
                    IsActive = true,
                };
                var result = await userManager.CreateAsync(admin, "Admin@1234");
                if (result.Succeeded)
                {
                    // Re-fetch from DB to ensure tracked entity
                    var createdAdmin = await userManager.FindByEmailAsync(adminEmail);
                    if (createdAdmin != null)
                        await userManager.AddToRoleAsync(createdAdmin, "Admin");
                }
                else
                {
                    logger.LogError("Failed to create admin: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
            else if (!await userManager.IsInRoleAsync(existingAdmin, "Admin"))
            {
                await userManager.AddToRoleAsync(existingAdmin, "Admin");
            }

            // Seed demo HR user
            const string hrEmail = "hr@company.com";
            var existingHr = await userManager.FindByEmailAsync(hrEmail);
            if (existingHr == null)
            {
                var hr = new ApplicationUser
                {
                    UserName = hrEmail,
                    Email = hrEmail,
                    EmailConfirmed = true,
                    FirstName = "HR",
                    LastName = "Manager",
                    IsActive = true,
                };
                var result = await userManager.CreateAsync(hr, "Hr@12345");
                if (result.Succeeded)
                {
                    var createdHr = await userManager.FindByEmailAsync(hrEmail);
                    if (createdHr != null)
                        await userManager.AddToRoleAsync(createdHr, "HR");
                }
                else
                {
                    logger.LogError("Failed to create HR user: {Errors}",
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
            else if (!await userManager.IsInRoleAsync(existingHr, "HR"))
            {
                await userManager.AddToRoleAsync(existingHr, "HR");
            }

            // Seed departments
            if (!await db.Departments.AnyAsync())
            {
                var departments = new[]
                {
                    new Department { Name = "Engineering", Description = "Software development team" },
                    new Department { Name = "Human Resources", Description = "HR & recruitment team" },
                    new Department { Name = "Sales & Marketing", Description = "Sales and marketing division" },
                    new Department { Name = "Finance", Description = "Finance and accounting" },
                    new Department { Name = "Operations", Description = "Business operations" },
                    new Department { Name = "Customer Support", Description = "Customer support team" },
                };
                db.Departments.AddRange(departments);
                await db.SaveChangesAsync();

                // Seed designations per department
                var engineering = await db.Departments.FirstAsync(d => d.Name == "Engineering");
                var hr = await db.Departments.FirstAsync(d => d.Name == "Human Resources");
                var sales = await db.Departments.FirstAsync(d => d.Name == "Sales & Marketing");

                var designations = new[]
                {
                    new Designation { Title = "Software Engineer", DepartmentId = engineering.Id, MinSalary = 60000, MaxSalary = 120000 },
                    new Designation { Title = "Senior Software Engineer", DepartmentId = engineering.Id, MinSalary = 90000, MaxSalary = 160000 },
                    new Designation { Title = "Tech Lead", DepartmentId = engineering.Id, MinSalary = 120000, MaxSalary = 200000 },
                    new Designation { Title = "HR Officer", DepartmentId = hr.Id, MinSalary = 40000, MaxSalary = 80000 },
                    new Designation { Title = "HR Manager", DepartmentId = hr.Id, MinSalary = 70000, MaxSalary = 120000 },
                    new Designation { Title = "Sales Executive", DepartmentId = sales.Id, MinSalary = 45000, MaxSalary = 90000 },
                    new Designation { Title = "Sales Manager", DepartmentId = sales.Id, MinSalary = 80000, MaxSalary = 140000 },
                };
                db.Designations.AddRange(designations);
                await db.SaveChangesAsync();
            }

            // Seed sample customers
            if (!await db.Customers.AnyAsync())
            {
                db.Customers.AddRange([
                    new Customer { Name = "Acme Corporation", Email = "contact@acme.com", Phone = "+1-555-0100", Company = "Acme Corp", City = "New York", Country = "USA", IsActive = true },
                    new Customer { Name = "Global Tech Ltd", Email = "info@globaltech.com", Phone = "+44-20-1234", Company = "Global Tech", City = "London", Country = "UK", IsActive = true },
                    new Customer { Name = "Pacific Ventures", Email = "sales@pacific.com", Phone = "+61-2-9876", Company = "Pacific Ventures", City = "Sydney", Country = "Australia", IsActive = true },
                ]);
                await db.SaveChangesAsync();
            }

            // Seed product categories
            if (!await db.ProductCategories.AnyAsync())
            {
                db.ProductCategories.AddRange([
                    new ProductCategory { Name = "Electronics", Description = "Electronic devices and components" },
                    new ProductCategory { Name = "Software", Description = "Software licenses and subscriptions" },
                    new ProductCategory { Name = "Office Supplies", Description = "Office stationery and supplies" },
                    new ProductCategory { Name = "Hardware", Description = "Computer hardware and peripherals" },
                ]);
                await db.SaveChangesAsync();
            }

            logger.LogInformation("Database seeded successfully.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding database.");
        }
    }
}
