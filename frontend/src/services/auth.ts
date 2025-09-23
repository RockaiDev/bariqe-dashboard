import axiosInstance from "@/helper/axiosInstance";

export type LoginPayload = {
  email: string;
  password: string;
};

export const loginRequest = async (data: LoginPayload) => {
  try {
    const res = await axiosInstance.post("/auth/signin", data);
    // axiosInstance interceptor returns response.data already
    console.debug('login response', res);
    return res;
  } catch (err: any) {
    console.error('login error', err);
    // normalize error shape for UI
    if (err?.result?.message) {
      throw err;
    }
    throw { result: { message: err?.message || 'Login failed' } };
  }

}; 

export async function logoutRequest() {
  return axiosInstance.post("/auth/signout", {}, { withCredentials: true });
}