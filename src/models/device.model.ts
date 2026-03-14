import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';

export interface DeviceAttributes {
  id?: number;
  licenseId: string;
  deviceId: string;
  deviceName?: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DeviceCreationAttributes = Optional<DeviceAttributes, 'id' | 'deviceName' | 'createdAt' | 'updatedAt'>;

export class Device extends Model<DeviceAttributes, DeviceCreationAttributes> implements DeviceAttributes {
  declare id: number;
  declare licenseId: string;
  declare deviceId: string;
  declare deviceName: string | null;
  declare firstSeenAt: Date;
  declare lastSeenAt: Date;
  declare active: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Device.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    licenseId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: 'license_id',
    },
    deviceId: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'device_id',
    },
    deviceName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'device_name',
    },
    firstSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'first_seen_at',
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_seen_at',
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'devices',
    modelName: 'Device',
    indexes: [
      {
        unique: true,
        fields: ['license_id', 'device_id'],
      },
      {
        fields: ['license_id', 'active'],
      },
    ],
  }
);
