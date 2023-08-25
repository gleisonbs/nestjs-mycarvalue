import { Test } from '@nestjs/testing';
import { AuthService } from '../../src/users/auth.service';
import { UsersService } from '../../src/users/users.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/users/users.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  const getUser = ({
    id = 1,
    email = 'email@test.com',
    password = 'password.test',
  } = {}): User => ({ id, email, password });

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: async (email: string) =>
        users.filter((user) => user.email === email),
      create: async (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random()) * 999999,
          email,
          password,
        } as User;
        users.push(user);
        return user;
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('email@test.com', 'password.test');

    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
    expect(user.password).not.toEqual('password.test');
    expect(hash).not.toEqual('password.test');
  });

  it('throws an error if user signup with an email that is in use', async () => {
    await service.signup('email@test.com', 'another.password.test'),
      await expect(
        service.signup('email@test.com', 'password.test'),
      ).rejects.toThrow(new BadRequestException('Email already in use'));
  });

  it('throws an error if user signin with a not registered email', async () => {
    await expect(
      service.signin('email@test.com', 'password.test'),
    ).rejects.toThrow(new NotFoundException('User not found'));
  });

  it('throws an error if user signin with a wrong password', async () => {
    await service.signup('email@test.com', 'password');
    await expect(
      service.signin('email@test.com', 'incorrect.password.test'),
    ).rejects.toThrow(new UnauthorizedException());
  });

  it('returns a user if signin info is correct', async () => {
    await service.signup('email@test.com', 'password');

    const user = await service.signin('email@test.com', 'password');
    expect(user).toBeDefined();
  });
});
