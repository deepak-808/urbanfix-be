// Shared type definitions for the JWT authentication system.

// Shape of the payload encoded inside every JWT issued by AuthService.
// `sub` holds the MongoDB user _id (string form) as per JWT convention.
export type JwtPayload = {
  sub: string;   // user._id as a string
  name: string;
  email: string;
  role: 'user' | 'provider' | 'admin';
};
