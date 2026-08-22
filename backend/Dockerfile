FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["src/ERP.Domain/ERP.Domain.csproj", "src/ERP.Domain/"]
COPY ["src/ERP.Application/ERP.Application.csproj", "src/ERP.Application/"]
COPY ["src/ERP.Infrastructure/ERP.Infrastructure.csproj", "src/ERP.Infrastructure/"]
COPY ["src/ERP.API/ERP.API.csproj", "src/ERP.API/"]

RUN dotnet restore "src/ERP.API/ERP.API.csproj"

COPY . .
WORKDIR "/src/src/ERP.API"
RUN dotnet build "ERP.API.csproj" -c Release -o /app/build
RUN dotnet publish "ERP.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ERP.API.dll"]
