import { Injectable, BadRequestException, UnauthorizedException, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { PasswordResetOtp } from '../entities/password-reset-otp.entity';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetOtp)
    private otpRepository: Repository<PasswordResetOtp>,
    private auditLogService: AuditLogService,
    private emailService: EmailService,
  ) {}

  async onApplicationBootstrap() {
    const superAdminEmail = 'uthman4ecc@gmail.com';
    const superAdminUser = await this.userRepository.findOne({
      where: { email: superAdminEmail },
    });

    if (!superAdminUser) {
      console.log('Seeding initial Super Admin account...');
      const passwordHash = await bcrypt.hash('Abdatahub@', 10);
      try {
        const admin = await this.usersService.create({
          fullName: 'Super Admin',
          email: superAdminEmail,
          phoneNumber: '07045357195',
          passwordHash,
          role: 'super_admin',
          permissions: ['*'],
          emailVerified: true,
          phoneVerified: true,
        });
        console.log(`Super Admin successfully seeded: ${admin.email}`);
      } catch (err) {
        console.error('Failed to seed Super Admin user:', err);
      }
    }

    // Backfill transaction pin for existing users without it
    const usersWithoutPin = await this.userRepository.find({
      where: { transactionPin: IsNull() },
    });
    if (usersWithoutPin.length > 0) {
      console.log(`Backfilling default transaction pin ('1234') for ${usersWithoutPin.length} user(s)...`);
      const defaultPinHash = await bcrypt.hash('1234', 10);
      for (const u of usersWithoutPin) {
        u.transactionPin = defaultPinHash;
        await this.userRepository.save(u);
      }
      console.log('Transaction pin backfill completed.');
    }
  }

  async register(registerDto: any) {
    const { fullName, email, phoneNumber, password, referralCode, transactionPin } = registerDto;

    if (!transactionPin) {
      throw new BadRequestException('Transaction PIN is required');
    }

    if (!/^\d{4}$/.test(transactionPin)) {
      throw new BadRequestException('Transaction PIN must be exactly 4 digits');
    }

    // Check if email already registered
    const existingEmail = await this.usersService.findOneByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email address is already registered');
    }

    // Check if phone already registered
    const existingPhone = await this.usersService.findOneByPhone(phoneNumber);
    if (existingPhone) {
      throw new BadRequestException('Phone number is already registered');
    }

    // Hash password & transaction PIN
    const passwordHash = await bcrypt.hash(password, 10);
    const transactionPinHash = await bcrypt.hash(transactionPin, 10);

    // Resolve referredBy using referralCode
    let referredById: string | null = null;
    if (referralCode) {
      const referrer = await this.userRepository.findOne({
        where: { referralCode: referralCode.toUpperCase() },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Determine initial role (first user is admin, others are user)
    const totalUsers = await this.userRepository.count();
    const role = totalUsers === 0 ? 'admin' : 'user';

    const user = await this.usersService.create({
      fullName,
      email,
      phoneNumber,
      passwordHash,
      transactionPin: transactionPinHash,
      role,
      referredBy: referredById || undefined,
    });

    const tokens = this.generateTokens(user);
    
    // Fire and forget welcome email asynchronously
    this.emailService.sendWelcomeEmail(fullName, email, password).catch((err) => {
      console.error('Failed to trigger welcome email in registration:', err);
    });

    // Sanitize user output
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async login(emailOrPhone: string, password: string) {
    let user = await this.usersService.findOneByEmail(emailOrPhone);
    if (!user) {
      user = await this.usersService.findOneByPhone(emailOrPhone);
    }

    if (!user) {
      await this.auditLogService.log(null, emailOrPhone, 'login_failed', { reason: 'User not found' });
      throw new UnauthorizedException('Invalid email/phone number or password');
    }

    if (user.status === 'suspended') {
      await this.auditLogService.log(user.id, user.email, 'login_failed', { reason: 'Account suspended' });
      throw new UnauthorizedException('Your account has been suspended. Contact support.');
    }

    // Check account lockout status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 1000);
      await this.auditLogService.log(user.id, user.email, 'login_failed', { reason: 'Account locked out' });
      throw new BadRequestException(
        `This account has been temporarily locked out due to multiple failed login attempts. Try again in ${remainingTime} second(s).`
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 30 * 1000); // Lockout for 30 seconds
        await this.userRepository.save(user);
        await this.auditLogService.log(user.id, user.email, 'account_lockout', {
          reason: 'Max failed login attempts reached',
        });
        throw new UnauthorizedException('Invalid email/phone number or password. Account locked for 30 seconds.');
      } else {
        await this.userRepository.save(user);
        await this.auditLogService.log(user.id, user.email, 'login_failed', {
          reason: 'Incorrect password',
          attemptsCount: user.loginAttempts,
        });
        throw new UnauthorizedException('Invalid email/phone number or password');
      }
    }

    // Success - reset counters
    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await this.userRepository.save(user);

    await this.auditLogService.log(user.id, user.email, 'login_success');

    const tokens = this.generateTokens(user);
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOneById(payload.sub);
      if (!user || user.status === 'suspended') {
        throw new UnauthorizedException('Invalid session token');
      }

      return {
        accessToken: this.jwtService.sign(
          { email: user.email, sub: user.id, role: user.role },
          { expiresIn: '24h' }
        ),
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private generateTokens(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '24h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException('No account was found with this email address.');
    }

    const existingOtp = await this.otpRepository.findOne({ where: { email } });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    if (existingOtp) {
      existingOtp.otpHash = otpHash;
      existingOtp.expiresAt = expiresAt;
      existingOtp.attempts = 0;
      await this.otpRepository.save(existingOtp);
    } else {
      const newOtp = this.otpRepository.create({
        email,
        otpHash,
        expiresAt,
        attempts: 0,
      });
      await this.otpRepository.save(newOtp);
    }

    // Send email asynchronously
    this.emailService.sendOtpEmail(email, otpCode).catch((err) => {
      console.error('Failed to trigger OTP email:', err);
    });

    return {
      success: true,
      message: 'OTP sent to email address',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const otpRecord = await this.otpRepository.findOne({ where: { email } });
    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await this.otpRepository.remove(otpRecord);
      throw new BadRequestException('Invalid or expired OTP.');
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await this.otpRepository.save(otpRecord);
      throw new BadRequestException('Invalid or expired OTP.');
    }

    // Delete OTP record on success
    await this.otpRepository.remove(otpRecord);

    // Generate short-lived reset token
    const resetToken = this.jwtService.sign(
      { email, type: 'reset' },
      { expiresIn: '10m' },
    );

    return {
      success: true,
      resetToken,
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(resetToken);
      if (payload.type !== 'reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const user = await this.usersService.findOneByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('No account was found with this email address.');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      user.passwordHash = passwordHash;
      await this.userRepository.save(user);

      await this.auditLogService.log(user.id, user.email, 'password_reset_success');

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
