import { faker } from '@faker-js/faker';
import { Prisma, PrismaClient, user } from '@prisma/client';
import { IFactory } from './factory';

const prisma = new PrismaClient();

type UserCreateInput = Prisma.userCreateInput;

class UserFactory implements IFactory<UserCreateInput, user> {
  /**
   * 단일 랜덤 사용자 생성 (DB에 저장하지 않음)
   * @param overrides - 오버라이드할 필드 값
   * @returns 생성된 사용자 객체
   */
  create(overrides?: Partial<UserCreateInput>): UserCreateInput {
    const email = overrides?.email || faker.internet.email();
    const username = overrides?.username || faker.internet.username();

    const userData: UserCreateInput = {
      username,
      encrypted_password:
        overrides?.encrypted_password ||
        faker.internet.password({ length: 12 }),
      email,
      created_at: overrides?.created_at || faker.date.past(),
      updated_at: overrides?.updated_at || faker.date.recent(),
      followers_count: overrides?.followers_count ?? 0,
      followings_count: overrides?.followings_count ?? 0,

      pfp: overrides?.pfp
        ? overrides?.pfp
        : {
            create: {
              curr: '/media/images/default/pfp',
              is_default: true,
            },
          },
      email_verification: overrides?.email_verification
        ? overrides?.email_verification
        : {
            create: {
              email_verified: false,
              verify_token: faker.string.uuid(),
              expired_at: faker.date.future(),
            },
          },
    };

    return userData;
  }

  /**
   * 단일 랜덤 사용자 생성 및 DB에 저장
   * @param overrides - 오버라이드할 필드 값
   * @returns 저장된 사용자 객체 (DB에서 반환된 값)
   */
  async createAndSave(overrides?: Partial<UserCreateInput>): Promise<user> {
    const userData = this.create(overrides);

    // 관계된 모델을 포함하여 사용자 생성 및 반환
    const savedUser = await prisma.user.create({
      data: userData,
      include: {
        pfp: true,
        email_verification: true,
      },
    });

    return savedUser;
  }

  /**
   * 여러 개의 랜덤 사용자 생성 (DB에 저장하지 않음)
   * @param options - 오버라이드 필드 값 및 생성 개수
   * @returns 생성된 사용자 객체 배열
   */
  createMany(options?: {
    overrides?: Partial<UserCreateInput>;
    count?: number;
  }): UserCreateInput[] {
    const { overrides = {}, count = 1 } = options ?? {};
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * 여러 개의 랜덤 사용자 생성 및 DB에 저장
   * @param options - 오버라이드 필드 값 및 생성 개수
   * @returns 저장된 사용자 객체 배열
   */
  async createManyAndSave(options?: {
    overrides?: Partial<UserCreateInput>;
    count?: number;
  }): Promise<user[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const usersData = this.createMany({ overrides, count });

    const savedUsers: user[] = [];
    for (const userData of usersData) {
      const savedUser = await prisma.user.create({
        data: userData,
        include: {
          pfp: true,
          email_verification: true,
        },
      });
      savedUsers.push(savedUser);
    }

    return savedUsers;
  }

  async cleanup(): Promise<void> {
    await prisma.user.deleteMany({});
  }
}

const userFactory = new UserFactory();

export default userFactory;
