/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppFooter } from "@/components/layout/AppFooter";
import {
  Building2,
  Camera,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  Tag,
  type LucideIcon,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { companyInformationService } from "@/services/companyInformationService";
import type { CompanyInformation } from "@/types/companyInformation";

type NavigationChild = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
};

type NavigationItem =
  | NavigationChild
  | {
      label: string;
      icon: LucideIcon;
      requiredPermissions?: string[];
      items: NavigationChild[];
    };

const navigationItems: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    requiredPermissions: ["dashboard.view"],
  },
  {
    label: "Operations",
    icon: ReceiptText,
    requiredPermissions: ["operations.view"],
    items: [
      {
        href: "/customers",
        label: "Customers",
        icon: UsersRound,
        requiredPermissions: ["customers.view", "customers.manage"],
      },
      {
        href: "/operations/appointments",
        label: "Appointments",
        icon: CalendarDays,
        requiredPermissions: ["appointments.view", "appointments.manage"],
      },
      {
        href: "/operations/pos",
        label: "Bookings",
        icon: ReceiptText,
        requiredPermissions: ["pos.view", "pos.manage"],
      },
    ],
  },
  {
    label: "Configuration",
    icon: Settings,
    requiredPermissions: ["configuration.view"],
    items: [
      {
        href: "/configuration/service-offered",
        label: "Service Offered",
        icon: Sparkles,
        requiredPermissions: [
          "service_offerings.view",
          "service_offerings.create",
          "service_offerings.update",
          "service_offerings.delete",
        ],
      },
      {
        href: "/configuration/service-categories",
        label: "Service Categories",
        icon: Tag,
        requiredPermissions: [
          "service_categories.view",
          "service_categories.create",
          "service_categories.update",
          "service_categories.delete",
        ],
      },
    ],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: ClipboardList,
    requiredPermissions: ["reports.view"],
  },
  {
    label: "Administration",
    icon: UserCog,
    requiredPermissions: ["administration.view"],
    items: [
      {
        href: "/administration/company-information",
        label: "Company Information",
        icon: Building2,
        requiredPermissions: [
          "company_information.view",
          "company_information.update",
        ],
      },
      {
        href: "/administration/camera-events",
        label: "Camera Events",
        icon: Camera,
        requiredPermissions: ["camera_events.view", "camera_events.manage"],
      },
      {
        href: "/administration/user-information",
        label: "User Information",
        icon: UsersRound,
        requiredPermissions: ["users.view", "users.update"],
      },
      {
        href: "/administration/rbac",
        label: "RBAC",
        icon: KeyRound,
        requiredPermissions: ["rbac.view", "rbac.manage"],
      },
    ],
  },
];

const fallbackCompanyName = "Jinmarx Wellness";
const fallbackCompanyTagline = "Wellness and Beauty Center";
const companyLogoSrc = "/images/jinmarx-logo.png";

function getSectionId(label: string) {
  return `sidenav-section-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

function getActiveSection(pathname: string) {
  return navigationItems.find(
    (item) =>
      "items" in item &&
      item.items.some(
        (child) =>
          pathname === child.href || pathname.startsWith(`${child.href}/`),
      ),
  );
}

function getInitials(firstName?: string, lastName?: string) {
  const value = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return value ? value.toUpperCase() : "JW";
}

function canAccessItem(
  requiredPermissions: string[] | undefined,
  permissionSet: Set<string>,
  isAdmin: boolean,
) {
  return (
    isAdmin ||
    !requiredPermissions?.length ||
    requiredPermissions.some((permission) => permissionSet.has(permission))
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading, permissions, roles } =
    useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyInformation, setCompanyInformation] =
    useState<CompanyInformation | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const activeSection = getActiveSection(pathname);
    return activeSection ? [activeSection.label] : [];
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function toggleSection(label: string) {
    setExpandedSections((current) =>
      current.includes(label)
        ? current.filter((sectionLabel) => sectionLabel !== label)
        : [...current, label],
    );
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyInformation() {
      if (!isAuthenticated) {
        return;
      }

      try {
        const response = await companyInformationService.get();

        if (isMounted) {
          setCompanyInformation(response);
        }
      } catch {
        if (isMounted) {
          setCompanyInformation(null);
        }
      }
    }

    void loadCompanyInformation();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const activeSection = getActiveSection(pathname);

    if (activeSection) {
      setExpandedSections((current) =>
        current.includes(activeSection.label)
          ? current
          : [...current, activeSection.label],
      );
    }

    setMobileOpen(false);
  }, [pathname]);

  const visibleNavigationItems = useMemo(() => {
    const permissionSet = new Set(permissions);
    const isAdmin = roles.includes("Admin");

    return navigationItems
      .map((item) => {
        if (!("items" in item)) {
          return canAccessItem(
            item.requiredPermissions,
            permissionSet,
            isAdmin,
          )
            ? item
            : null;
        }

        const visibleChildren = item.items.filter((child) =>
          canAccessItem(child.requiredPermissions, permissionSet, isAdmin),
        );

        if (
          visibleChildren.length === 0 ||
          (!isAdmin &&
            !canAccessItem(item.requiredPermissions, permissionSet, isAdmin))
        ) {
          return null;
        }

        return {
          ...item,
          items: visibleChildren,
        };
      })
      .filter((item): item is NavigationItem => Boolean(item));
  }, [permissions, roles]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-shell)] px-4">
        <div className="panel w-full max-w-sm rounded-[28px] border border-black/8 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-black)] text-[var(--color-gold)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">
            Loading workspace
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const initials = getInitials(user?.firstName, user?.lastName);
  const companyName =
    companyInformation?.companyName.trim() || fallbackCompanyName;
  const companyTagline =
    companyInformation?.tagline?.trim() || fallbackCompanyTagline;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--color-shell)]">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-dvh w-[min(88vw,300px)] flex-col bg-[var(--color-black)] px-4 py-5 text-white transition-transform sm:px-5 sm:py-6 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-2.5 transition hover:border-[rgba(212,175,55,0.25)] hover:bg-white/[0.05]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(212,175,55,0.28)] bg-black shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
              <Image
                src={companyLogoSrc}
                alt={`${companyName} logo`}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight text-white">
                {companyName}
              </h1>
              <p className="mt-0.5 truncate text-[11px] font-medium text-white/55">
                {companyTagline}
              </p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-white/70 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="sidenav-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1.5">
          {visibleNavigationItems.map((section) => {
            const SectionIcon = section.icon;
            const isParentSection = "items" in section;

            if (!isParentSection) {
              const active =
                pathname === section.href ||
                pathname.startsWith(`${section.href}/`);

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-[var(--color-gold)] text-black"
                      : "text-white/80 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <SectionIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </Link>
              );
            }

            const isExpanded = expandedSections.includes(section.label);
            const isActive = section.items.some(
              (item) =>
                pathname === item.href || pathname.startsWith(`${item.href}/`),
            );

            return (
              <div key={section.label} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition",
                    isActive
                      ? "bg-[rgba(212,175,55,0.18)] text-[var(--color-gold)]"
                      : "text-white/80 hover:bg-white/[0.08] hover:text-white",
                  )}
                  aria-expanded={isExpanded}
                  aria-controls={getSectionId(section.label)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <SectionIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{section.label}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                {isExpanded ? (
                  <div
                    id={getSectionId(section.label)}
                    className="space-y-2 pl-4"
                  >
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                            active
                              ? "bg-[var(--color-champagne)] text-black"
                              : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex h-full min-h-0 flex-col overflow-hidden lg:pl-[300px]">
        <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-black/6 bg-[rgba(251,247,240,0.88)] px-3 py-3 backdrop-blur sm:px-4 sm:py-4 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-2xl border border-black/10 bg-white p-3 text-[var(--color-ink)] shadow-sm lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
              Massage Center Workspace
            </p>
            <p className="mt-0.5 hidden text-xs text-[var(--color-muted)] sm:block">
              Operations, configuration, and administration modules
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {user?.fullName ?? "Jinmarx User"}
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                {user?.roles[0] ?? "Staff"}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-sm font-semibold text-[var(--color-black)] shadow-[0_10px_22px_rgba(212,175,55,0.22)]">
              {initials}
            </div>
            <Button
              variant="ghost"
              className="hidden rounded-full sm:inline-flex"
              onClick={handleLogout}
              loading={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-ink)] transition hover:bg-black/[0.04] disabled:opacity-60 sm:hidden"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-3 py-5 sm:px-4 sm:py-6 lg:px-8 lg:py-8">
            {children}
            <AppFooter companyName={companyName} />
          </div>
        </main>
      </div>
    </div>
  );
}
