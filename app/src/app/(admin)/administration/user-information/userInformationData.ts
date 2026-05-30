export interface UserInformationRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  isTherapist: boolean;
  isActive: boolean;
  hasPinConfigured: boolean;
}

export const userInformationRows: UserInformationRow[] = [
  {
    id: "front-desk-admin",
    firstName: "Front Desk",
    lastName: "Admin",
    email: "owner@jinmarx.local",
    phone: "0917 500 6376",
    username: "owner@jinmarx.local",
    role: "Administrator",
    isTherapist: false,
    isActive: true,
    hasPinConfigured: true,
  },
  {
    id: "sample-therapist",
    firstName: "Sample",
    lastName: "Therapist",
    email: "therapist@jinmarx.local",
    phone: "0917 555 0198",
    username: "therapist@jinmarx.local",
    role: "Staff",
    isTherapist: true,
    isActive: true,
    hasPinConfigured: true,
  },
  {
    id: "reception-staff",
    firstName: "Reception",
    lastName: "Staff",
    email: "reception@jinmarx.local",
    phone: "0917 555 0144",
    username: "reception@jinmarx.local",
    role: "Staff",
    isTherapist: false,
    isActive: true,
    hasPinConfigured: false,
  },
];

export function getUserFullName(user: UserInformationRow) {
  return `${user.firstName} ${user.lastName}`;
}

export function getUserById(id: string) {
  return userInformationRows.find((user) => user.id === id);
}
