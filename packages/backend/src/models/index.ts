import { sequelize } from "../config/db";
import User from "./User";
import Staff from "./Staff";
import Patient from "./Patient";
import Appointment from "./Appointment";
import Encounter from "./Encounter";
import Complaint from "./Complaint";
import Invoice from "./Invoice";
import Payment from "./Payment";
import OrganizationSetting from "./OrganizationSetting";
import Package from "./Package";
import Triage from "./Triage";
import InvestigationTest from "./InvestigationTest";
import InvestigationRequest from "./InvestigationRequest";
import InvestigationResult from "./InvestigationResult";
import Product from "./Product";
import AppointmentType from "./AppointmentType";
import PaymentMethod from "./PaymentMethod";
import Organization from "./Organization";
import OrganisationSetting from "./OrganisationSetting";

// Associations are mostly defined in individual files now, 
// but we can ensure global ones here if needed.

export {
  User,
  Staff,
  Patient,
  Appointment,
  Encounter,
  Complaint,
  Invoice,
  Payment,
  OrganizationSetting,
  Package,
  Triage,
  InvestigationTest,
  InvestigationRequest,
  InvestigationResult,
  Product,
  AppointmentType,
  PaymentMethod,
  Organization,
  OrganisationSetting,
  sequelize
};

export default {
  User,
  Staff,
  Patient,
  Appointment,
  Encounter,
  Complaint,
  Invoice,
  Payment,
  OrganizationSetting,
  Package,
  Triage,
  InvestigationTest,
  InvestigationRequest,
  InvestigationResult,
  Product,
  AppointmentType,
  PaymentMethod,
  Organization,
  OrganisationSetting,
  sequelize
};