import { sequelize } from '../config/database.config';
import { ActivationKey } from './activationkey.model';
import { License } from './license.model';
import { Device } from './device.model';

// 设置模型关联
ActivationKey.belongsTo(License, {
  foreignKey: 'licenseId',
  as: 'license',
});

License.hasMany(ActivationKey, {
  foreignKey: 'licenseId',
  as: 'activationKeys',
});

Device.belongsTo(License, {
  foreignKey: 'licenseId',
  as: 'license',
});

License.hasMany(Device, {
  foreignKey: 'licenseId',
  as: 'devices',
});

// 导出所有模型
export { ActivationKey, License, Device };
export { sequelize };

// 同步数据库
export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
}
