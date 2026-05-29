import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { ApiError } from '../middleware/errorHandler';
import { StatusCodes } from 'http-status-codes';
import { publishEvent } from '../config/rabbitmq';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: RegisterDto, channel: any) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Email already registered'
      );
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')
    );

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'customer',
        status: 'active',
        emailVerified: false,
      },
    });

    // Create default preferences
    await prisma.userPreference.create({
      data: {
        userId: user.id,
        language: 'pt-BR',
        currency: 'BRL',
        theme: 'light',
        notifications: {},
      },
    });

    // Publish user registered event
    await publishEvent(channel, 'user.registered', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      timestamp: new Date().toISOString(),
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(data: LoginDto, channel: any) {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid credentials'
      );
    }

    if (user.status !== 'active') {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Account is not active'
      );
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid credentials'
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Publish user logged in event
    await publishEvent(channel, 'user.logged_in', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'Invalid refresh token'
      );
    }

    return this.generateTokens(
      user.id,
      user.email,
      user.role
    );
  }

  async logout(userId: string) {
    // Invalidate sessions
    await prisma.userSession.deleteMany({
      where: {
        userId,
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string
  ) {
    const payload = {
      id: userId,
      email,
      role,
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      {
        expiresIn: 60 * 60 * 24 * 7, // 7 dias
      }
    );

    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET as string,
      {
        expiresIn: 60 * 60 * 24 * 30, // 30 dias
      }
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}

export default new AuthService();