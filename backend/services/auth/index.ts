import { genSaltSync, hashSync, compareSync } from "bcryptjs";
import { sign, verify } from "jsonwebtoken";

const JWT = process.env.JWT;
export default abstract class AuthFeatures {
  public GenerateToken(data: any) {
  return sign(data, JWT, { expiresIn: "1d" });
  }

  public GenerateHash(password: string): string {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  public CompareHash(password: string, hash: string): boolean {
    return compareSync(password, hash);
  }
  public VerifyTokenString(token: string) {
    try {
      return verify(token, JWT) as any;
    } catch (error) {
      return null;
    }
  }
}
