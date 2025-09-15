export class CreateUserDto {
  username: string;
  password: string;
  name?: string;
  surname?: string;
  description?: string;
  avatarUrl?: string;
}
