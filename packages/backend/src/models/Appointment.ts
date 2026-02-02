import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/db";

// Appointment Attributes
export interface AppointmentAttributes {
  id: number;
  patient_id: number;
  provider_id?: number | null;
  appointment_type_id?: number | null;
  appointment_type_custom?: string | null;
  appointment_date: string;
  appointment_time: string;
  end_time?: string | null;
  duration_minutes?: number;
  status: 'Scheduled' | 'Confirmed' | 'Checked-in' | 'In-progress' | 'Completed' | 'Cancelled' | 'No-show' | 'Rescheduled';
  notes?: string | null;
  reason_for_visit?: string | null;
  reminder_type?: 'None' | 'SMS' | 'Email' | 'Both';
  reminder_sent?: boolean;
  reminder_sent_at?: Date | null;
  reminder_days_before?: number;
  booked_by?: number | null;
  booking_source?: 'Walk-in' | 'Phone' | 'Online' | 'App' | 'Referral';
  original_appointment_id?: number | null;
  reschedule_count?: number;
  reschedule_reason?: string | null;
  cancelled_at?: Date | null;
  cancelled_by?: number | null;
  cancellation_reason?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type AppointmentCreationAttributes = Optional<
  AppointmentAttributes,
  "id" | "provider_id" | "appointment_type_id" | "status" | "created_at" | "updated_at"
>;

export class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
  public id!: number;
  public patient_id!: number;
  public provider_id?: number | null;
  public appointment_type_id?: number | null;
  public appointment_type_custom?: string | null;
  public appointment_date!: string;
  public appointment_time!: string;
  public end_time?: string | null;
  public duration_minutes?: number;
  public status!: 'Scheduled' | 'Confirmed' | 'Checked-in' | 'In-progress' | 'Completed' | 'Cancelled' | 'No-show' | 'Rescheduled';
  public notes?: string | null;
  public reason_for_visit?: string | null;
  public reminder_type?: 'None' | 'SMS' | 'Email' | 'Both';
  public reminder_sent?: boolean;
  public reminder_sent_at?: Date | null;
  public reminder_days_before?: number;
  public booked_by?: number | null;
  public booking_source?: 'Walk-in' | 'Phone' | 'Online' | 'App' | 'Referral';
  public original_appointment_id?: number | null;
  public reschedule_count?: number;
  public reschedule_reason?: string | null;
  public cancelled_at?: Date | null;
  public cancelled_by?: number | null;
  public cancellation_reason?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Appointment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    provider_id: { type: DataTypes.INTEGER, allowNull: true },
    appointment_type_id: { type: DataTypes.INTEGER, allowNull: true },
    appointment_type_custom: { type: DataTypes.STRING(200), allowNull: true },
    appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
    appointment_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 30 },
    status: {
      type: DataTypes.ENUM('Scheduled', 'Confirmed', 'Checked-in', 'In-progress', 'Completed', 'Cancelled', 'No-show', 'Rescheduled'),
      defaultValue: 'Scheduled'
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    reason_for_visit: { type: DataTypes.STRING(500), allowNull: true },
    reminder_type: {
      type: DataTypes.ENUM('None', 'SMS', 'Email', 'Both'),
      defaultValue: 'SMS'
    },
    reminder_sent: { type: DataTypes.BOOLEAN, defaultValue: false },
    reminder_sent_at: { type: DataTypes.DATE, allowNull: true },
    reminder_days_before: { type: DataTypes.INTEGER, defaultValue: 1 },
    booked_by: { type: DataTypes.INTEGER, allowNull: true },
    booking_source: {
      type: DataTypes.ENUM('Walk-in', 'Phone', 'Online', 'App', 'Referral'),
      defaultValue: 'Walk-in'
    },
    original_appointment_id: { type: DataTypes.INTEGER, allowNull: true },
    reschedule_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    reschedule_reason: { type: DataTypes.STRING(500), allowNull: true },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
    cancelled_by: { type: DataTypes.INTEGER, allowNull: true },
    cancellation_reason: { type: DataTypes.STRING(500), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: "Appointment",
    tableName: "appointments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
