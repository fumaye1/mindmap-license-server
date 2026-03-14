import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';

export interface ActivationKeyAttributes {
  id?: number;
  key: string;
  licenseId?: string | null;
  maxMajor: number;
  maxVersion: string;
  seats: number;
  disabled: boolean;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ActivationKeyCreationAttributes = Optional<
  ActivationKeyAttributes,
  'id' | 'licenseId' | 'expiresAt' | 'createdAt' | 'updatedAt'
>;

export class ActivationKey
  extends Model<ActivationKeyAttributes, ActivationKeyCreationAttributes>
  implements ActivationKeyAttributes
{
  declare id: number;
  declare key: string;
  declare licenseId: string | null;
  declare maxMajor: number;
  declare maxVersion: string;
  declare seats: number;
  declare disabled: boolean;
  declare expiresAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ActivationKey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(64),
      unique: true,
      allowNull: false,
    },
    licenseId: {
      type: DataTypes.STRING(64),
      allowNull: true,
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
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
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
    tableName: 'activation_keys',
    modelName: 'ActivationKey',
    indexes: [
      {
        unique: true,
        fields: ['key'],
      },
      {
        fields: ['license_id'],
      },
    ],
  }
);
