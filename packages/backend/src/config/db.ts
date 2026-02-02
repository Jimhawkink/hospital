import { Sequelize, Model, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: console.log,
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

export class OrganisationSetting extends Model {
  public id!: number;
  public organisation_name!: string;
  public country!: string;
  public city!: string;
  public county!: string;
  public sub_county!: string;
  public ward!: string;
  public town!: string;
  public logo_path!: string | null;
}

OrganisationSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    organisation_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sub_county: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ward: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    town: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'OrganisationSetting',
    tableName: 'organisation_settings',
    timestamps: true,
  }
);

export { sequelize };