import { SignedLicense, LicensePayload } from '../types';
import { config } from '../config/app.config';
import { signLicense as signLicenseUtil, verifySigned as verifySignedUtil } from '../utils/crypto.utils';

export class SignatureService {
  /**
   * 签名许可证
   */
  static signLicense(payload: LicensePayload): SignedLicense {
    return signLicenseUtil(payload, config);
  }

  /**
   * 验证签名许可证
   */
  static verifySigned(signed: SignedLicense): LicensePayload {
    return verifySignedUtil(signed, config);
  }

  /**
   * 创建许可证负载
   */
  static createLicensePayload(params: {
    licenseId: string;
    seats: number;
    maxVersion: string;
    nextCheckAt: number;
    maxMajor?: number;
    issuedAt: number;
    customerId?: string;
    orderId?: string;
  }): LicensePayload {
    return {
      licenseId: params.licenseId,
      seats: params.seats,
      maxVersion: params.maxVersion,
      nextCheckAt: params.nextCheckAt,
      maxMajor: params.maxMajor,
      issuedAt: params.issuedAt,
      customerId: params.customerId,
      orderId: params.orderId,
    };
  }
}
