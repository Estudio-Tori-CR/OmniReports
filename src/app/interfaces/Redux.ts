import { Role } from "./Roles";

interface UserState {
  _id: string;
  fullName: string;
  email: string;
  role: Array<Role>;
  lastPathReports: string
}

export type { UserState };
