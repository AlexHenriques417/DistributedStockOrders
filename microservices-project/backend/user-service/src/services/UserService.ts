import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UpdateUserDto, ChangePasswordDto, CreateAddressDto } from '../dtos/auth.dto';
import { ApiError } from '../middleware/errorHandler';
import { StatusCodes } from 'http-status-codes';

const prisma = new PrismaClient();

export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        preferences: true,
      },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(
      data.newPassword,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')
    );

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  async createAddress(userId: string, data: CreateAddressDto) {
    const address = await prisma.userAddress.create({
      data: {
        ...data,
        userId,
      },
    });

    return address;
  }

  async getAddresses(userId: string) {
    return prisma.userAddress.findMany({
      where: { userId },
    });
  }

  async updateAddress(userId: string, addressId: string, data: Partial<CreateAddressDto>) {
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
    }

    return prisma.userAddress.update({
      where: { id: addressId },
      data,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Address not found');
    }

    await prisma.userAddress.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  async getPreferences(userId: string) {
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Preferences not found');
    }

    return preferences;
  }

  async updatePreferences(userId: string, data: any) {
    return prisma.userPreference.update({
      where: { userId },
      data,
    });
  }
}

export default new UserService();
