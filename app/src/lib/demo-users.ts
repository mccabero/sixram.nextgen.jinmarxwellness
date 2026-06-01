import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { CurrentUser, LoginRequest } from "@/types/auth";

const localAdminUsername = "owner@jinmarx.local";
const localAdminPassword = "ChangeThisBeforeProduction123!";
const localAdminPin = "123456";

function getConfiguredValue(key: string, localFallback: string) {
  const value = process.env[key]?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${key} must be configured in production.`);
  }

  return localFallback;
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function getSeedAdminUser(): CurrentUser {
  const username = getConfiguredValue(
    "JINMARX_ADMIN_USERNAME",
    localAdminUsername,
  );

  return {
    id: "seed-admin",
    username,
    fullName: "Jinmarx Owner",
    firstName: "Jinmarx",
    lastName: "Owner",
    roles: ["Admin"],
    permissions: [
      { code: "dashboard.view", name: "View dashboard" },
      { code: "operations.view", name: "View operations menu" },
      { code: "appointments.view", name: "View appointments" },
      { code: "appointments.manage", name: "Manage appointments" },
      { code: "pos.view", name: "View bookings" },
      { code: "pos.manage", name: "Manage bookings" },
      { code: "customers.view", name: "View customers" },
      { code: "customers.manage", name: "Manage customers" },
      { code: "configuration.view", name: "View configuration menu" },
      { code: "service_offerings.view", name: "View service offerings" },
      { code: "service_offerings.create", name: "Create service offerings" },
      { code: "service_offerings.update", name: "Update service offerings" },
      { code: "service_offerings.delete", name: "Delete service offerings" },
      { code: "reports.view", name: "View reports" },
      { code: "administration.view", name: "View administration menu" },
      { code: "company_information.view", name: "View company information" },
      { code: "company_information.update", name: "Manage company information" },
      { code: "camera_events.view", name: "View camera events" },
      { code: "camera_events.manage", name: "Manage camera events" },
      { code: "users.view", name: "View user information" },
      { code: "users.update", name: "Manage user information" },
      { code: "rbac.view", name: "View RBAC" },
      { code: "rbac.manage", name: "Manage RBAC" },
    ],
  };
}

export function validateAdminCredentials(input: LoginRequest) {
  if (input.loginMode === "pin") {
    const expectedPin = getConfiguredValue("JINMARX_ADMIN_PIN", localAdminPin);
    return safeEquals(input.pin ?? "", expectedPin);
  }

  const expectedUsername = getConfiguredValue(
    "JINMARX_ADMIN_USERNAME",
    localAdminUsername,
  );
  const expectedPassword = getConfiguredValue(
    "JINMARX_ADMIN_PASSWORD",
    localAdminPassword,
  );

  return (
    safeEquals(input.username?.trim().toLowerCase() ?? "", expectedUsername.toLowerCase()) &&
    safeEquals(input.password ?? "", expectedPassword)
  );
}
