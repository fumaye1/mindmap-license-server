-- MySQL schema (VPS / 轻量服务器: Express + MySQL)
-- This schema matches the Sequelize models under src/models/*.

-- NOTE:
-- - Use utf8mb4 for full Unicode
-- - If you use a separate DB user, grant privileges only on this database

-- Activation keys
CREATE TABLE IF NOT EXISTS activation_keys (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(64) NOT NULL,
  license_id VARCHAR(64) NULL,
  max_major INT NOT NULL,
  max_version VARCHAR(32) NOT NULL,
  seats INT NOT NULL DEFAULT 3,
  disabled TINYINT(1) NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_activation_keys_key (`key`),
  KEY idx_activation_keys_license_id (license_id),
  KEY idx_activation_keys_max_version (max_version),
  KEY idx_activation_keys_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Licenses
CREATE TABLE IF NOT EXISTS licenses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  license_id VARCHAR(64) NOT NULL,
  max_major INT NOT NULL,
  max_version VARCHAR(32) NOT NULL,
  seats INT NOT NULL DEFAULT 3,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_licenses_license_id (license_id),
  KEY idx_licenses_max_version (max_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  license_id VARCHAR(64) NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  device_name VARCHAR(255) NULL,
  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_devices_license_device (license_id, device_id),
  KEY idx_devices_license_active (license_id, active),
  CONSTRAINT fk_devices_license_id FOREIGN KEY (license_id) REFERENCES licenses(license_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
