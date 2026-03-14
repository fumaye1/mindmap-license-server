import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';

export interface LicenseAttributes {
  id?: number;
  licenseId: string;
  maxMajor: number;
  maxVersion: string;
  seats: number;
  issuedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LicenseCreationAttributes = Optional<LicenseAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class License extends Model<LicenseAttributes, LicenseCreationAttributes> implements LicenseAttributes {
  declare id: number;
  declare licenseId: string;
  declare maxMajor: number;
  declare maxVersion: string;
  declare seats: number;
  declare issuedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

License.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    licenseId: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
      field: 'license_id',
    },
    maxMajor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_major',
    },
    maxVersion: {
      type: DataTypes.STRING(32),
      allowNull: false,
      field: 'max_version',
    },
    seats: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'issued_at',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'licenses',
    modelName: 'License',
    indexes: [
      {
        unique: true,
        fields: ['license_id'],
      },
    ],
  }
);
