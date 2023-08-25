import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { AuthService } from '../../src/users/auth.service';
import { User } from '../../src/users/users.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: async (id: number) => ({
        id,
        email: 'email@test.com',
        password: 'password.test',
      }),
      find: async (email: string) => [
        {
          id: 1,
          email,
          password: 'password.test',
        },
      ],
      // remove: () => {},
      // update: () => {},
    };
    fakeAuthService = {
      // signup: () => {},
      signin: async (email: string, password: string) => ({
        id: 1,
        email,
        password,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: AuthService, useValue: fakeAuthService },
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllUsers returns a lits of user with the given email', async () => {
    const allUsers = await controller.findAllUsers('test@email.com');
    expect(allUsers.length).toEqual(1);
    expect(allUsers[0].email).toEqual('test@email.com');
  });

  it('findUser returns a user with the given id', async () => {
    const user = await controller.findUser('1');
    expect(user).toBeDefined();
    expect(user.id).toEqual(1);
  });

  it('findUser throws if no user with the given id is found', async () => {
    jest.spyOn(fakeUsersService, 'findOne').mockResolvedValueOnce(null);
    const user = controller.findUser('1000');
    expect(user).rejects.toThrow(new NotFoundException('user not found'));
  });

  it('Signin updates session object and returns user', async () => {
    const session: { userId: number } = { userId: undefined };
    const user = await controller.signin(
      {
        email: 'test@email.com',
        password: 'test.password',
      },
      session,
    );

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  });
});
