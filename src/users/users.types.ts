export type User = {
  userId: number;
  username: string;
  password: string;
};

export type UserWithoutPassword = Omit<User, 'password'>;
