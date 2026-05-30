namespace Sixram.Nextgen.JinmarxWellness.Application.Authorization;

public static class ApplicationPermissions
{
    public static class Dashboard
    {
        public const string View = "dashboard.view";
    }

    public static class Operations
    {
        public const string View = "operations.view";
    }

    public static class Appointments
    {
        public const string View = "appointments.view";
        public const string Manage = "appointments.manage";
    }

    public static class PointOfSale
    {
        public const string View = "pos.view";
        public const string Manage = "pos.manage";
    }

    public static class Customers
    {
        public const string View = "customers.view";
        public const string Manage = "customers.manage";
    }

    public static class Configuration
    {
        public const string View = "configuration.view";
    }

    public static class ServiceOfferings
    {
        public const string View = "service_offerings.view";
        public const string Create = "service_offerings.create";
        public const string Update = "service_offerings.update";
        public const string Delete = "service_offerings.delete";
    }

    public static class ServiceCategories
    {
        public const string View = "service_categories.view";
        public const string Create = "service_categories.create";
        public const string Update = "service_categories.update";
        public const string Delete = "service_categories.delete";
    }

    public static class Reports
    {
        public const string View = "reports.view";
    }

    public static class Administration
    {
        public const string View = "administration.view";
    }

    public static class CompanyInformation
    {
        public const string View = "company_information.view";
        public const string Update = "company_information.update";
    }

    public static class Users
    {
        public const string View = "users.view";
        public const string Update = "users.update";
    }

    public static class Rbac
    {
        public const string View = "rbac.view";
        public const string Manage = "rbac.manage";
    }

    public static IReadOnlyCollection<PermissionDefinition> All { get; } =
    [
        new(Dashboard.View, "View Dashboard", "Allows the user to open the dashboard.", "Dashboard"),
        new(Operations.View, "View Operations Menu", "Allows the user to see operations menu items.", "Operations"),
        new(Appointments.View, "View Appointments", "Allows the user to view appointments.", "Operations"),
        new(Appointments.Manage, "Manage Appointments", "Allows the user to create and update appointments.", "Operations"),
        new(PointOfSale.View, "View POS", "Allows the user to open POS checkout.", "Operations"),
        new(PointOfSale.Manage, "Manage POS", "Allows the user to process checkout transactions.", "Operations"),
        new(Customers.View, "View Customers", "Allows the user to view customers.", "Operations"),
        new(Customers.Manage, "Manage Customers", "Allows the user to create and update customer records.", "Operations"),
        new(Configuration.View, "View Configuration Menu", "Allows the user to see configuration menu items.", "Configuration"),
        new(ServiceCategories.View, "View Service Categories", "Allows the user to view service categories.", "Configuration"),
        new(ServiceCategories.Create, "Create Service Categories", "Allows the user to add service categories.", "Configuration"),
        new(ServiceCategories.Update, "Update Service Categories", "Allows the user to update service categories.", "Configuration"),
        new(ServiceCategories.Delete, "Delete Service Categories", "Allows the user to delete service categories.", "Configuration"),
        new(ServiceOfferings.View, "View Service Offered", "Allows the user to view service offerings.", "Configuration"),
        new(ServiceOfferings.Create, "Create Service Offered", "Allows the user to add service offerings.", "Configuration"),
        new(ServiceOfferings.Update, "Update Service Offered", "Allows the user to update service offerings.", "Configuration"),
        new(ServiceOfferings.Delete, "Delete Service Offered", "Allows the user to delete service offerings.", "Configuration"),
        new(Reports.View, "View Reports", "Allows the user to open reports.", "Reports"),
        new(Administration.View, "View Administration Menu", "Allows the user to see administration menu items.", "Administration"),
        new(CompanyInformation.View, "View Company Information", "Allows the user to view company information.", "Administration"),
        new(CompanyInformation.Update, "Update Company Information", "Allows the user to update company information.", "Administration"),
        new(Users.View, "View User Information", "Allows the user to view user information.", "Administration"),
        new(Users.Update, "Update User Information", "Allows the user to update user information.", "Administration"),
        new(Rbac.View, "View RBAC", "Allows the user to view roles and permissions.", "Administration"),
        new(Rbac.Manage, "Manage RBAC", "Allows the user to update role permissions.", "Administration")
    ];
}
